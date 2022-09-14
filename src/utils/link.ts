import axios from "axios";
import { load } from "cheerio";
import { LinkData } from "../../@types/interfaces";

class LinkUtils {
  getAllLinksFromText(text: string) {
    if (!text) {
      return [];
    }

    return (
      text.match(
        /\b((https?):\/\/|(www)\.)[-A-Z0-9+&@#\/%?=~_|$!:,.;]*[A-Z0-9+&@#\/%=~_|$]/gi
      ) || []
    );
  }

  isValidURL(url: string) {
    try {
      new URL(url);

      return true;
    } catch (error) {
      return false;
    }
  }

  isSaturnChatURL(url: string) {}

  transformRelativePathInURL(baseURL: string, path: string) {
    if (!baseURL || !path) return null;

    const relativePathRegex = new RegExp("^(?:[a-z+]+:)?//", "i");
    const isURL = this.isValidURL(path);

    if (isURL) return path;

    const url = new URL(baseURL);
    const isAbsolutePath = relativePathRegex.test(path);

    if (isAbsolutePath) return path;

    const pathWithInitialSlash = path.indexOf("/") === 0 ? path : "/" + path;

    return `${url.protocol}//${url.hostname}${pathWithInitialSlash}`;
  }

  async getDataFromLink(link: string): Promise<LinkData> {
    if (!link) return null;

    try {
      const { data, status } = await axios.get(link);

      if (status !== 200) return null;

      const $ = load(data);
      const siteName =
        $("head > meta[property='og:site_name']").attr("content") || null;
      const title =
        $("head > meta[property='og:title']").attr("content") ||
        $("head > title").text() ||
        null;
      const description =
        $("head > meta[property='og:description']").attr("content") ||
        $("head > meta[name='description']").attr("content") ||
        null;
      const favicon = $("head > link[rel='icon']").attr("href") || null;
      const image =
        $("head > meta[property='og:image']").attr("content") || null;

      return {
        link,
        siteName,
        title,
        description,
        favicon: this.transformRelativePathInURL(link, favicon),
        image: this.transformRelativePathInURL(link, image),
      };
    } catch (_) {
      return null;
    }
  }
}

export { LinkUtils };
