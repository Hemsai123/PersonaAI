from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
import json
import requests
import os
import random

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
    groq_ready = bool(os.getenv('GROQ_API_KEY'))
    return JsonResponse({'ok': True, 'at': int(timezone.now().timestamp() * 1000), 'groqReady': groq_ready})

@csrf_exempt
@require_http_methods(['POST'])
def ask(request):
    try:
        data = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    prompt = data.get('prompt', '')
    messages = data.get('messages', [])

    if not prompt and not messages:
        return JsonResponse({'error': 'No prompt or messages provided'}, status=400)

    groq_api_key = os.getenv('GROQ_API_KEY')
    if not groq_api_key:
        return JsonResponse({'error': 'Groq API key not configured on server'}, status=500)

    groq_messages = messages or [
        {'role': 'system', 'content': 'You are a decision helper. Respond clearly and logically.'},
        {'role': 'user', 'content': prompt},
    ]

    groq_model = os.getenv('GROQ_MODEL')
    fallback_model = os.getenv('GROQ_FALLBACK_MODEL')
    MODELS = [m for m in [groq_model, fallback_model] if m]
    if not MODELS:
        MODELS = ['compound-beta']
    last_error = None
    last_status = 500

    for model in MODELS:
        try:
            r = requests.post(
                'https://api.groq.com/openai/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {groq_api_key}',
                    'Content-Type': 'application/json',
                },
                json={
                    'model': model,
                    'messages': groq_messages,
                    'temperature': 0.4,
                    'max_tokens': 1024,
                },
                timeout=30,
            )

            if not r.ok:
                error_body = {}
                try:
                    error_body = r.json()
                except Exception:
                    pass
                err = Exception(f"Groq API error {r.status_code}: {error_body.get('error', {}).get('message', r.text)}")
                err.status_code = r.status_code
                raise err

            resp = r.json()
            answer = resp.get('choices', [{}])[0].get('message', {}).get('content', '')
            if not answer:
                raise Exception('Empty response from model')

            return JsonResponse({'answer': answer, 'model': model})
        except Exception as e:
            last_error = e
            last_status = getattr(e, 'status_code', None) or getattr(e, 'status', None) or 500
            if last_status not in [413, 429, 500, 503]:
                break

    error_msg = str(last_error) if last_error else 'Failed to get response from AI'
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
@require_http_methods(['POST'])
def generate_video(request):
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
