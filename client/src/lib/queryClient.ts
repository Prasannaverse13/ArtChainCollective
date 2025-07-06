import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    console.error(`API Error: ${res.status}: ${text} for ${res.url}`);
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Make sure URL is properly formatted with proper origin
  const isAbsoluteUrl = url.startsWith('http') || url.startsWith('//');
  let formattedUrl = url;
  
  if (!isAbsoluteUrl) {
    formattedUrl = url.startsWith('/') ? url : `/${url}`;
  }
  
  console.log(`API Request: ${method} ${formattedUrl}`);
  
  try {
    const res = await fetch(formattedUrl, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    if (!res.ok) {
      console.error(`API Error in ${method} ${formattedUrl}: Status ${res.status}`);
    }
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`API Request Failed: ${method} ${formattedUrl}`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Make sure URL is properly formatted
    const url = queryKey[0] as string;
    const isAbsoluteUrl = url.startsWith('http') || url.startsWith('//');
    let formattedUrl = url;
    
    if (!isAbsoluteUrl) {
      formattedUrl = url.startsWith('/') ? url : `/${url}`;
    }
    
    console.log(`Query Request: GET ${formattedUrl}`);
    
    try {
      const res = await fetch(formattedUrl, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`Unauthorized request to ${formattedUrl}, returning null as configured`);
        return null;
      }

      if (!res.ok) {
        console.error(`Query Error in GET ${formattedUrl}: Status ${res.status}`);
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error(`Query Request Failed: GET ${formattedUrl}`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
