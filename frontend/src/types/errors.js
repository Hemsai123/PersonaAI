export class TwitterError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.name = 'TwitterError';
    }
}
export class APIError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.name = 'APIError';
    }
}
export class ValidationError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.name = 'ValidationError';
    }
}
