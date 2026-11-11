import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
    const isApiOrAuthRoute = pathname.startsWith('/api') || pathname.startsWith('/auth');

    const createRedirect = (targetPath: string) => {
        const redirectResponse = NextResponse.redirect(new URL(targetPath, request.url));
        response.cookies.getAll().forEach((cookie) => {
            redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
        });
        return redirectResponse;
    };

    // 1. Unauthenticated users cannot access protected routes
    if (!user) {
        if (!isAuthPage && !isApiOrAuthRoute && pathname !== '/') {
            return createRedirect('/login');
        }
        return response;
    }

    // 2. Extract user role from user_metadata (defaults to STUDENT for principle of least privilege)
    const userRole = (user.user_metadata?.role as string | undefined)?.toUpperCase() || 'STUDENT';

    // 3. Authenticated users visiting auth pages get redirected to their designated dashboard
    if (isAuthPage) {
        if (userRole === 'TPO_ADMIN') return createRedirect('/admin');
        if (userRole === 'RECRUITER') return createRedirect('/recruiter');
        return createRedirect('/student');
    }

    // 4. Role-based Route Protection
    if (userRole === 'STUDENT') {
        // Students cannot view /admin or /recruiter routes
        if (pathname.startsWith('/admin') || pathname.startsWith('/recruiter')) {
            return createRedirect('/student');
        }
    } else if (userRole === 'RECRUITER') {
        // Recruiters cannot view /admin or student portal routes
        if (pathname.startsWith('/admin') || pathname.startsWith('/student')) {
            return createRedirect('/recruiter');
        }
    } else if (userRole === 'TPO_ADMIN') {
        // TPO Admins should not access student-specific workflow pages
        if (pathname.startsWith('/student')) {
            return createRedirect('/admin');
        }
    }

    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};