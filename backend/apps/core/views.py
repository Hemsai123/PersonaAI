from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from pathlib import Path
from dotenv import load_dotenv
import json
import requests
import os
import random
import time

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / '.env')
load_dotenv(BASE_DIR.parent / '.env')
load_dotenv()

@require_http_methods(['GET'])
def health(request):
    return JsonResponse({
        'ok': True,
        'pexels': bool(os.getenv('PEXELS_API_KEY')),
        'heygen': bool(os.getenv('HEYGEN_API_KEY')),
        'hf': bool(os.getenv('HF_API_TOKEN')),
        'replicate': bool(os.getenv('REPLICATE_API_TOKEN')),
    })

@require_http_methods(['GET'])
def ping(request):
    ai_ready = bool(os.getenv('GROQ_API_KEY') or os.getenv('GEMINI_API_KEY'))
    return JsonResponse({'ok': True, 'at': int(timezone.now().timestamp() * 1000), 'groqReady': ai_ready, 'aiReady': ai_ready})

@csrf_exempt
@require_http_methods(['POST'])
def ask(request):
    try:
        data = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    # Safely extract prompt and messages whether data is a dict or list
    if isinstance(data, dict):
        prompt = data.get('prompt', '')
        messages = data.get('messages', [])
    elif isinstance(data, list):
        prompt = ''
        messages = data
    else:
        prompt = ''
        messages = []

    if not prompt and not messages:
        return JsonResponse({'error': 'No prompt or messages provided'}, status=400)

    # Support either GEMINI_API_KEY or GROQ_API_KEY
    gemini_key = os.getenv('GEMINI_API_KEY', '').strip()
    groq_key = os.getenv('GROQ_API_KEY', '').strip()

    # Auto-detect if user placed a Google Gemini key (starts with 'AQ.' or 'AIza') in GROQ_API_KEY
    if not gemini_key and (groq_key.startswith('AQ.') or groq_key.startswith('AIza')):
        gemini_key = groq_key
        groq_key = ''

    # Filter out placeholder strings
    if groq_key in ['gsk_your_groq_api_key_here', 'your_groq_api_key_here']:
        groq_key = ''
    if gemini_key in ['your_gemini_api_key_here', 'AIza_your_key']:
        gemini_key = ''

    if not gemini_key and not groq_key:
        return JsonResponse({
            'error': 'No AI API key configured on server. Please set GEMINI_API_KEY or GROQ_API_KEY in backend/.env'
        }, status=500)

    ai_messages = messages or [
        {'role': 'system', 'content': 'You are a decision helper. Respond clearly and logically.'},
        {'role': 'user', 'content': prompt},
    ]

    # Configure providers list with automatic fallback
    providers = []

    # Configure Groq provider (fast, 14,400 free req/day)
    if groq_key:
        groq_model = os.getenv('GROQ_MODEL') or 'qwen/qwen3.8-27b'
        fallback_model = os.getenv('GROQ_FALLBACK_MODEL') or 'openai/gpt-oss-120b'
        raw_g_models = [
            groq_model,
            fallback_model,
            'qwen/qwen3.8-27b',
            'openai/gpt-oss-120b',
            'openai/gpt-oss-20b',
            'allam-2-7b',
        ]
        seen_g = set()
        g_models = [m for m in raw_g_models if m and not (m in seen_g or seen_g.add(m))]
        providers.append({
            'name': 'Groq',
            'endpoint': 'https://api.groq.com/openai/v1/chat/completions',
            'headers': {
                'Authorization': f'Bearer {groq_key}',
                'Content-Type': 'application/json',
            },
            'models': g_models
        })

    # Configure Gemini provider
    if gemini_key:
        providers.append({
            'name': 'Gemini',
            'endpoint': 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
            'headers': {
                'Authorization': f'Bearer {gemini_key}',
                'x-goog-api-key': gemini_key,
                'Content-Type': 'application/json',
            },
            'models': [os.getenv('GEMINI_MODEL') or 'gemini-3.8-flash', 'gemini-3.8-flash']
        })

    last_error = None
    last_status = 500

    for provider in providers:
        provider_name = provider['name']
        endpoint = provider['endpoint']
        headers = provider['headers']
        seen = set()
        MODELS = [m for m in provider['models'] if m and not (m in seen or seen.add(m))]

        for model in MODELS:
            for attempt in range(2):
                try:
                    print(f"[AI Engine] Calling {provider_name} with model: {model} (attempt {attempt + 1})...")
                    r = requests.post(
                        endpoint,
                        headers=headers,
                        json={
                            'model': model,
                            'messages': ai_messages,
                            'temperature': 0.4,
                            'max_tokens': 1024,
                        },
                        timeout=12,
                    )

                    if not r.ok:
                        error_body = None
                        try:
                            error_body = r.json()
                        except Exception:
                            error_body = None

                        err_text = ''
                        if isinstance(error_body, dict):
                            err_val = error_body.get('error')
                            if isinstance(err_val, dict):
                                err_text = err_val.get('message', '')
                            elif isinstance(err_val, str):
                                err_text = err_val
                            if not err_text:
                                err_text = error_body.get('message', '')
                        elif isinstance(error_body, list) and len(error_body) > 0:
                            first = error_body[0]
                            if isinstance(first, dict):
                                err_val = first.get('error')
                            if isinstance(err_val, dict):
                                err_text = err_val.get('message', '')
                            elif isinstance(err_val, str):
                                err_text = err_val
                            if not err_text:
                                err_text = first.get('message', '')
                        elif isinstance(first, str):
                            err_text = first

                        if not err_text:
                            err_text = r.text or f"HTTP {r.status_code}"

                        # If 404 (model deprecated or not found on provider), immediately skip to next model
                        if r.status_code == 404:
                            print(f"[AI Engine] Model '{model}' not found on {provider_name} (404), skipping...")
                            err = Exception(f"{provider_name} model {model} not found (404).")
                            err.status_code = 404
                            raise err

                        # If temporary 503 (high demand spike), automatically retry with backoff
                        if r.status_code == 503 and attempt < 1:
                            time.sleep(1.5 * (attempt + 1))
                            continue

                        # If quota exceeded (429), break out immediately to try fallback provider
                        if r.status_code == 429 and 'Quota exceeded' in err_text:
                            err = Exception(f"{provider_name} quota exceeded (daily free limit reached). {err_text}")
                            err.status_code = 429
                            raise err

                        err = Exception(f"{provider_name} API error {r.status_code}: {err_text}")
                        err.status_code = r.status_code
                        raise err

                    resp = r.json()
                    answer = ''
                    if isinstance(resp, dict):
                        choices = resp.get('choices')
                        if isinstance(choices, list) and len(choices) > 0 and isinstance(choices[0], dict):
                            msg = choices[0].get('message')
                            if isinstance(msg, dict):
                                answer = msg.get('content', '')
                        if not answer:
                            candidates = resp.get('candidates')
                            if isinstance(candidates, list) and len(candidates) > 0 and isinstance(candidates[0], dict):
                                content_obj = candidates[0].get('content')
                                if isinstance(content_obj, dict):
                                    parts = content_obj.get('parts')
                                    if isinstance(parts, list) and len(parts) > 0 and isinstance(parts[0], dict):
                                        answer = parts[0].get('text', '')
                    elif isinstance(resp, list) and len(resp) > 0 and isinstance(resp[0], dict):
                        choices = resp[0].get('choices')
                        if isinstance(choices, list) and len(choices) > 0 and isinstance(choices[0], dict):
                            msg = choices[0].get('message')
                            if isinstance(msg, dict):
                                answer = msg.get('content', '')
                        if not answer:
                            candidates = resp[0].get('candidates')
                            if isinstance(candidates, list) and len(candidates) > 0 and isinstance(candidates[0], dict):
                                content_obj = candidates[0].get('content')
                                if isinstance(content_obj, dict):
                                    parts = content_obj.get('parts')
                                    if isinstance(parts, list) and len(parts) > 0 and isinstance(parts[0], dict):
                                        answer = parts[0].get('text', '')

                    if not answer:
                        raise Exception('Empty response from model')

                    print(f"[AI Engine] Successfully generated response with {provider_name} ({model})")
                    return JsonResponse({'answer': answer, 'model': model, 'provider': provider_name})
                except Exception as e:
                    last_error = e
                    last_status = getattr(e, 'status_code', None) or getattr(e, 'status', None) or 500
                    if last_status == 503 and attempt < 1:
                        time.sleep(1.5 * (attempt + 1))
                        continue
                    # Break attempt loop on 429/404/timeouts to move to next model or provider
                    break

    error_msg = str(last_error) if last_error else 'Failed to get response from AI'
    if last_status == 429 and ('quota' in error_msg.lower() or 'rate' in error_msg.lower()):
        if not groq_key:
            error_msg = (
                "Google Gemini free daily limit (20 requests/day) reached. "
                "To chat without limits, add a free Groq API key (GROQ_API_KEY) in backend/.env "
                "(get key at https://console.groq.com/keys for 14,400 free requests/day with no waiting)."
            )
    try:
        status_code = int(last_status) if isinstance(last_status, (int, str)) else 500
    except (TypeError, ValueError):
        status_code = 500
    if status_code >= 500 and last_error is not None and '413' in str(last_error):
        status_code = 413
    return JsonResponse({'error': error_msg}, status=min(status_code, 500) if isinstance(status_code, int) else 500)

DEFAULT_AVATAR_ID = os.getenv('DEFAULT_HEYGEN_AVATAR_ID')
DEFAULT_VOICE_ID = os.getenv('DEFAULT_HEYGEN_VOICE_ID')
HEYGEN_API_KEY = os.getenv('HEYGEN_API_KEY')
HEYGEN = os.getenv('HEYGEN_API_BASE', 'https://api.heygen.ai')
PEXELS_KEY = os.getenv('PEXELS_API_KEY')
FAL_KEY = os.getenv('FAL_KEY')

ETHEREAL_WALKING_CLIPS = [
    'https://videos.pexels.com/video-files/3822765/3822765-hd_1920_1080_24fps.mp4',
    'https://videos.pexels.com/video-files/9278563/9278563-uhd_2560_1440_30fps.mp4',
    'https://videos.pexels.com/video-files/6772137/6772137-hd_1920_1080_30fps.mp4',
    'https://videos.pexels.com/video-files/7132289/7132289-hd_2048_1080_30fps.mp4',
]

CLIPS = [
    {'kw': ['ocean','sea','beach','waves','coast','water','surf'], 'url': 'https://videos.pexels.com/video-files/29285421/12630603_360_640_60fps.mp4'},
    {'kw': ['city','street','urban','neon','night','traffic','skyline','downtown'], 'url': 'https://videos.pexels.com/video-files/34960003/14809225_640_360_30fps.mp4'},
    {'kw': ['forest','mountain','nature','river','waterfall','himalaya','trees','green'], 'url': 'https://videos.pexels.com/video-files/11986207/11986207-hd_1920_1080_30fps.mp4'},
    {'kw': ['fire','smoke','storm','lightning','thunder','rain','volcano'], 'url': 'https://videos.pexels.com/video-files/32168330/13717340_682_360_30fps.mp4'},
    {'kw': ['tech','technology','code','coding','programming','ai','hud','matrix','neural'], 'url': 'https://videos.pexels.com/video-files/7278622/7278622-sd_426_226_24fps.mp4'},
    {'kw': ['cat','dog','animal','bird','wildlife','pet','kitten','puppy'], 'url': 'https://videos.pexels.com/video-files/36241097/15369419_360_640_60fps.mp4'},
    {'kw': ['space','galaxy','stars','nebula','astronomy','cosmos'], 'url': 'https://videos.pexels.com/video-files/30442061/13045437_640_360_30fps.mp4'},
    {'kw': ['desert','sand','dune','camel'], 'url': 'https://videos.pexels.com/video-files/30783914/13167280_360_640_30fps.mp4'},
    {'kw': ['snow','ice','winter','glacier'], 'url': 'https://videos.pexels.com/video-files/36351394/15417889_360_640_30fps.mp4'},
]

DEFAULT_DEMO_URL = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'

def pick_from_map(prompt=''):
    p = str(prompt).lower()
    for entry in CLIPS:
        if any(k in p for k in entry['kw']):
            return entry['url']
    return DEFAULT_DEMO_URL

def send_demo(res, url, message='web-demo'):
    return JsonResponse({'status': 'succeeded', 'url': url or DEFAULT_DEMO_URL, 'message': message})

@csrf_exempt
@require_http_methods(['POST'])
def memorial_video(request):
    try:
        data = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    
    image = data.get('image')
    if not image:
        return JsonResponse({'error': 'Image is required'}, status=400)
    
    video_url = random.choice(ETHEREAL_WALKING_CLIPS)
    return JsonResponse({'videoUrl': video_url, 'isEthereal': True, 'provider': 'iconic-walking'})

@csrf_exempt
@require_http_methods(['POST', 'GET', 'DELETE'])
def generate_video(request):
    if request.method == 'GET':
        return generate_video_status(request)
    if request.method == 'DELETE':
        return cancel_video(request)

    try:
        data = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    
    prompt = data.get('prompt', '')
    avatar_id = data.get('avatar_id')
    voice_id = data.get('voice_id')
    dimension = data.get('dimension')
    provider = data.get('provider', 'web')
    aspect_ratio = data.get('aspectRatio', '16:9')
    
    if not prompt or len(str(prompt).strip()) < 2:
        return JsonResponse({'error': 'Prompt/script is required'}, status=400)
    
    orientation = 'landscape'
    if aspect_ratio == '9:16':
        orientation = 'portrait'
    elif aspect_ratio == '1:1':
        orientation = 'square'
    
    if provider == 'web' or provider == 'demo':
        web_url = pick_from_map(prompt)
        return send_demo(None, web_url, 'web-map' if not PEXELS_KEY else 'web-pexels')
    
    if provider in ['luma', 'pika', 'runway', 'veo']:
        if not FAL_KEY:
            web_url = pick_from_map(prompt)
            return send_demo(None, web_url, 'no-fal-key-web')
        
        model_map = {
            'luma': 'fal-ai/luma-dream-machine',
            'pika': 'fal-ai/pika',
            'runway': 'fal-ai/kling-video/v1.6/standard/text-to-video',
            'veo': 'fal-ai/luma-dream-machine',
        }
        model = model_map.get(provider, 'fal-ai/luma-dream-machine')
        
        try:
            r = requests.post(
                f'https://fal.run/{model}',
                headers={
                    'Authorization': f'Key {FAL_KEY}',
                    'Content-Type': 'application/json',
                },
                json={
                    'prompt': prompt,
                    'aspect_ratio': aspect_ratio or '16:9',
                },
                timeout=60,
            )
            
            if not r.ok:
                raise Exception(f'Fal error {r.status}')
            
            fal_data = r.json()
            
            if fal_data.get('video', {}).get('url'):
                return JsonResponse({'status': 'succeeded', 'url': fal_data['video']['url'], 'progress': 100, 'message': f'fal-{provider}'})
            elif fal_data.get('request_id'):
                return JsonResponse({'jobId': fal_data['request_id'], 'provider': 'fal'})
            raise Exception('No video URL or request ID from Fal')
        except Exception as e:
            web_url = pick_from_map(prompt)
            return send_demo(None, web_url, f'fal-fail-web: {str(e)}')
    
    if not HEYGEN_API_KEY:
        web_url = pick_from_map(prompt)
        return send_demo(None, web_url, 'no-heygen-key-web')
    
    use_avatar = avatar_id or DEFAULT_AVATAR_ID
    use_voice = voice_id or DEFAULT_VOICE_ID
    
    if not use_avatar or not use_voice:
        web_url = pick_from_map(prompt)
        return send_demo(None, web_url, 'no-ids-web')
    
    dim = dimension if (dimension and dimension.get('width', 0) > 0 and dimension.get('height', 0) > 0) else {'width': 1280, 'height': 720}
    
    payload = {
        'video_inputs': [{'avatar_id': use_avatar, 'voice_id': use_voice, 'input_text': str(prompt)}],
        'dimension': dim,
    }
    
    try:
        r = requests.post(
            f'{HEYGEN}/v2/video/generate',
            headers={
                'Content-Type': 'application/json',
                'X-Api-Key': HEYGEN_API_KEY,
            },
            json=payload,
            timeout=30,
        )
        
        if not r.ok:
            web_url = pick_from_map(prompt)
            return send_demo(None, web_url, f'heygen-create-{r.status}-web')
        
        body = r.json()
        job_id = body.get('data', {}).get('video_id')
        if not job_id:
            web_url = pick_from_map(prompt)
            return send_demo(None, web_url, 'heygen-no-video_id-web')
        
        return JsonResponse({'jobId': job_id})
    except Exception as e:
        web_url = pick_from_map(prompt)
        return send_demo(None, web_url, f'server-exception-web: {str(e)}')

@require_http_methods(['GET'])
def generate_video_status(request):
    job_id = request.GET.get('jobId')
    if not job_id:
        return send_demo(None, DEFAULT_DEMO_URL, 'no-jobid-web')
    
    if not HEYGEN_API_KEY and not FAL_KEY:
        return send_demo(None, DEFAULT_DEMO_URL, 'no-keys-web')
    
    if '-' in job_id or len(job_id) > 20:
        try:
            r = requests.get(
                f'https://fal.run/requests/{job_id}',
                headers={'Authorization': f'Key {FAL_KEY}'},
                timeout=30,
            )
            if not r.ok:
                raise Exception(f'Fal status error {r.status}')
            
            data = r.json()
            status_map = {'IN_PROGRESS': 'running', 'COMPLETED': 'succeeded', 'FAILED': 'failed', 'IN_QUEUE': 'queued'}
            status = status_map.get(data.get('status'), 'running')
            
            return JsonResponse({
                'status': status,
                'url': data.get('payload', {}).get('video', {}).get('url') or data.get('payload', {}).get('url'),
                'progress': 100 if status == 'succeeded' else (50 if status == 'running' else 10),
                'message': data.get('status', 'running'),
            })
        except Exception as e:
            pass
    
    try:
        r = requests.get(
            f'{HEYGEN}/v2/video/status?video_id={job_id}',
            headers={
                'Content-Type': 'application/json',
                'X-Api-Key': HEYGEN_API_KEY,
            },
            timeout=30,
        )
        if not r.ok:
            return send_demo(None, DEFAULT_DEMO_URL, f'heygen-status-{r.status}-web')
        
        body = r.json()
        raw = body.get('data', {})
        status = raw.get('status', 'running')
        mapped = 'succeeded' if status == 'completed' else ('failed' if status == 'failed' else 'running')
        url = raw.get('video_url')
        
        if mapped != 'succeeded':
            return JsonResponse({
                'status': mapped,
                'url': None,
                'progress': 60 if status == 'processing' else 10,
                'message': raw.get('error_message') or status or 'running',
            })
        
        return JsonResponse({
            'status': 'succeeded',
            'url': url or DEFAULT_DEMO_URL,
            'progress': 100,
            'message': status or 'completed',
        })
    except Exception as e:
        return send_demo(None, DEFAULT_DEMO_URL, 'server-exception-web')

@csrf_exempt
@require_http_methods(['DELETE'])
def cancel_video(request):
    job_id = request.GET.get('jobId')
    if not job_id or not HEYGEN_API_KEY:
        return JsonResponse({'ok': True})
    
    try:
        requests.delete(
            f'{HEYGEN}/v1/video.delete',
            headers={
                'Content-Type': 'application/json',
                'X-Api-Key': HEYGEN_API_KEY,
            },
            json={'video_id': job_id},
            timeout=30,
        )
    except:
        pass
    
    return JsonResponse({'ok': True})
