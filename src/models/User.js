export class User {
    constructor(data = {}) {
        this.email = data.email || '';
        this.role = data.role || (data.isAdmin ? 'admin' : 'user');
        this.isAdmin = this.role !== 'user';
        this.sub = data.sub || null;
        this.data = data; // Store original data just in case
    }

    static fromToken(decodedToken) {
        if (!decodedToken) return null;
        return new User(decodedToken);
    }

    static fromResponse(responseUser) {
        if (!responseUser) return null;
        return new User(responseUser);
    }
}
