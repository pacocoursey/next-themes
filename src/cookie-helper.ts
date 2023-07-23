interface CookieOptions {
  path?: string;
  expires?: Date | number;
  domain?: string;
  secure?: boolean;
}

class CookieManager {
  getCookie(name: string): string | undefined {
    const cookieStr = document.cookie;
    const cookies = this.parseCookieString(cookieStr);
    return cookies[name];
  }

  setCookie(name: string, value: string, options?: CookieOptions): void {
    let cookieStr = `${name}=${encodeURIComponent(value)}`;

    if (options) {
      if (options.path) cookieStr += `; path=${options.path}`;
      if (options.expires) {
        const expirationDate =
          options.expires instanceof Date
            ? options.expires.toUTCString()
            : new Date(Date.now() + options.expires * 1000).toUTCString();
        cookieStr += `; expires=${expirationDate}`;
      }
      if (options.domain) cookieStr += `; domain=${options.domain}`;
      if (options.secure) cookieStr += `; secure`;
    }

    document.cookie = cookieStr;
  }

  private parseCookieString(cookieStr: string): { [key: string]: string } {
    const cookieMap: { [key: string]: string } = {};
    const cookiePairs = cookieStr.split(";");

    cookiePairs.forEach((pair) => {
      const [key, value] = pair.trim().split("=");
      cookieMap[key] = decodeURIComponent(value);
    });

    return cookieMap;
  }
}

export const cookieManager = new CookieManager();
