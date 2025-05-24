//生成隨機短網址
export function generateShortUrl(length: number = 6) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

//驗證網址格式
export function isValidUrl(url: string) {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
}

//生成短網址
export function formatShortUrl(shortId: string, baseUrl: string='') {
    const base = baseUrl || 'http://localhost:3000'
    return `${base}/${shortId}`
}
