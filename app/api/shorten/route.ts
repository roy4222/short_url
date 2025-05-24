import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateShortUrl, isValidUrl, formatShortUrl } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        // 從請求 body 解析 originalUrl
        const body = await request.json();
        const { originalUrl } = body;

        // 驗證必要欄位
        if (!originalUrl) {
            return NextResponse.json(
                { error: '缺少必要的 originalUrl 欄位' },
                { status: 400 }
            );
        }

        // 使用 isValidUrl 確認 originalUrl 格式
        if (!isValidUrl(originalUrl)) {
            return NextResponse.json(
                { error: '無效的網址格式' },
                { status: 400 }
            );
        }

        // 生成唯一的短網址 ID
        let shortId: string;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!isUnique && attempts < maxAttempts) {
            shortId = generateShortUrl(6);
            
            // 檢查 shortId 的唯一性
            const urlsRef = collection(db, 'urls');
            const q = query(urlsRef, where('shortId', '==', shortId));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                isUnique = true;
            } else {
                attempts++;
            }
        }

        if (!isUnique) {
            return NextResponse.json(
                { error: '無法生成唯一的短網址，請稍後再試' },
                { status: 500 }
            );
        }

        // 準備要存入 Firestore 的資料
        const urlData = {
            originalUrl,
            shortId: shortId!,
            createdAt: new Date()
        };

        // 將資料存入 Firestore 的 urls 集合
        const urlsRef = collection(db, 'urls');
        const docRef = await addDoc(urlsRef, urlData);

        // 使用 formatShortUrl 組裝完整的短網址
        const shortUrl = formatShortUrl(shortId!);

        return NextResponse.json({
            success: true,
            data: {
                id: docRef.id,
                originalUrl,
                shortUrl,
                shortId: shortId!,
                createdAt: urlData.createdAt
            }
        }, { status: 201 });

    } catch (error) {
        console.error('生成短網址時發生錯誤:', error);
        
        // Firebase 錯誤處理
        if (error instanceof Error) {
            if (error.message.includes('permission-denied')) {
                return NextResponse.json(
                    { error: '資料庫權限不足' },
                    { status: 403 }
                );
            }
            
            if (error.message.includes('unavailable')) {
                return NextResponse.json(
                    { error: '資料庫服務暫時無法使用' },
                    { status: 503 }
                );
            }
        }

        return NextResponse.json(
            { error: '伺服器內部錯誤，請稍後再試' },
            { status: 500 }
        );
    }
}
