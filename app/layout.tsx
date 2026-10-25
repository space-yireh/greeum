import type { Metadata } from 'next'; import './globals.css';
export const metadata:Metadata={title:'조금 다른 나 · 캐리커처 스튜디오',description:'사진 한 장으로 만나는 세 가지 나의 모습'};
export default function Layout({children}:{children:React.ReactNode}) { return <html lang="ko"><body>{children}</body></html>; }
