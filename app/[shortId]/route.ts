import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * 定義動態路由參數的型別介面
 * 用於 Next.js App Router 中的動態路由 [shortId]
 * 
 * @interface RouteParams
 * @property {Object} params - 路由參數物件
 * @property {string} params.shortId - 從 URL 路徑中提取的短網址 ID
 */
interface RouteParams {
    params: {
        shortId: string;
    };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { shortId } = params;

        // 驗證 shortId 是否存在
        if (!shortId) {
            return NextResponse.json(
                { error: '缺少短網址 ID' },
                { status: 400 }
            );
        }

        // 從 Firestore 查詢對應的原始網址
        const urlsRef = collection(db, 'urls');
        const q = query(urlsRef, where('shortId', '==', shortId));
        const querySnapshot = await getDocs(q);

        // 檢查是否找到對應的文件
        if (querySnapshot.empty) {
            return NextResponse.json(
                { error: '短網址不存在或已失效' },
                { status: 400 }
            );
        }

        // 取得第一個匹配的文件資料
        const doc = querySnapshot.docs[0];
        const urlData = doc.data();
        const originalUrl = urlData.originalUrl;

        // 驗證原始網址是否存在
        if (!originalUrl) {
            return NextResponse.json(
                { error: '原始網址資料遺失' },
                { status: 400 }
            );
        }

        // 重定向到原始網址
        return NextResponse.redirect(originalUrl, 302);

    } catch (error) {
        console.error('短網址解析時發生錯誤:', error);
        
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
