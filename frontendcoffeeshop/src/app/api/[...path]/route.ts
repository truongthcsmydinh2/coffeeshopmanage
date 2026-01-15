import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.API_URL || 'http://backend:8000'

async function proxyRequest(request: NextRequest, path: string[]) {
    const url = new URL(request.url)

    // Construct backend URL with path and query string
    // Add trailing slash for collection endpoints (no extension, no specific ID at end)
    let backendPath = '/api/' + path.join('/')

    // Add trailing slash ONLY for collection endpoints that need it
    // FastAPI routes are defined without trailing slashes for most action endpoints
    // Only add slash for collection endpoints (plural nouns that list/create resources)
    const collectionEndpoints = [
        '/orders', '/tables', '/menu-items', '/menu-groups', '/staff', '/shifts',
        '/staff-roles', '/staff-attendance', '/staff-performance', '/staff-schedule',
        '/promotions', '/payments', '/products', '/categories', '/complete-orders'
    ]
    const needsSlash = collectionEndpoints.some(ep => backendPath.endsWith(ep))
    if (needsSlash && !backendPath.endsWith('/')) {
        backendPath += '/'
    }

    const backendUrl = `${BACKEND_URL}${backendPath}${url.search}`

    console.log(`Proxying ${request.method} ${url.pathname} -> ${backendUrl}`)

    try {
        // Forward the request to the backend
        const headers = new Headers(request.headers)
        // Remove headers that could cause issues
        headers.delete('host')
        headers.delete('x-forwarded-proto')  // Don't pass HTTPS info to avoid redirect issues
        headers.delete('x-forwarded-host')

        const fetchOptions: RequestInit = {
            method: request.method,
            headers: headers,
            // Don't follow redirects - we handle this manually to avoid SSL errors
            redirect: 'manual',
        }

        // Include body for non-GET/HEAD requests
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            const body = await request.text()
            if (body) {
                fetchOptions.body = body
            }
        }

        const response = await fetch(backendUrl, fetchOptions)

        // If we get a redirect, follow it manually with HTTP
        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('location')
            if (location) {
                // Convert any https redirect to http for internal backend
                let redirectUrl = location
                if (redirectUrl.startsWith('https://backend:')) {
                    redirectUrl = redirectUrl.replace('https://', 'http://')
                }
                // If it's a relative path, make it absolute
                if (redirectUrl.startsWith('/')) {
                    redirectUrl = `${BACKEND_URL}${redirectUrl}`
                }

                console.log(`Following redirect: ${location} -> ${redirectUrl}`)

                const redirectResponse = await fetch(redirectUrl, {
                    method: request.method,
                    headers: headers,
                    redirect: 'manual',
                })

                const redirectHeaders = new Headers(redirectResponse.headers)
                redirectHeaders.delete('transfer-encoding')

                const data = await redirectResponse.text()
                return new NextResponse(data, {
                    status: redirectResponse.status,
                    statusText: redirectResponse.statusText,
                    headers: redirectHeaders,
                })
            }
        }

        // Clone response headers
        const responseHeaders = new Headers(response.headers)
        // Remove transfer-encoding as Next.js handles this
        responseHeaders.delete('transfer-encoding')

        // Return the response
        const data = await response.text()
        return new NextResponse(data, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        })
    } catch (error) {
        console.error('Proxy error:', error)
        return NextResponse.json(
            { error: 'Failed to connect to backend', details: String(error) },
            { status: 502 }
        )
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return proxyRequest(request, params.path)
}

export async function POST(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return proxyRequest(request, params.path)
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return proxyRequest(request, params.path)
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return proxyRequest(request, params.path)
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return proxyRequest(request, params.path)
}
