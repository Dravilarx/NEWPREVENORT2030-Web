"use client"

import { usePathname } from 'next/navigation'
import Sidebar from "./Sidebar"

export default function AppWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isPublic = pathname.startsWith('/verificar')

    return (
        <div className="app-container">
            {!isPublic && <Sidebar />}
            <main className={`main-content ${isPublic ? 'public' : ''}`}>
                {children}
            </main>

            <style jsx global>{`
                .app-container {
                    display: flex;
                    min-height: 100vh;
                }
                .main-content {
                    flex: 1;
                    margin-left: 280px;
                    padding: 0;
                    background-color: var(--bg-app);
                    transition: margin 0.3s;
                }
                .main-content.public {
                    margin-left: 0;
                    padding: 0;
                }
                @media (max-width: 1024px) {
                    .main-content {
                        margin-left: 0;
                    }
                }
            `}</style>
        </div>
    )
}
