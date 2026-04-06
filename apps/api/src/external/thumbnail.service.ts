import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from './cache.service';

const THUMB_WIDTH = 400;
const CACHE_TTL = 86400; // 24h — resolved URLs are stable
const REQUEST_DELAY_MS = 100; // Wikimedia etiquette: don't hammer
const USER_AGENT = 'TimisoaraApp/1.0 (https://github.com/timisoara-app; contact@timisoara.app)';

@Injectable()
export class ThumbnailService {
  private readonly logger = new Logger(ThumbnailService.name);

  constructor(private cache: CacheService) {}

  /**
   * Resolve a thumbnail URL from OSM tags.
   * Priority: image > wikimedia_commons > wikipedia > wikidata
   */
  async resolveImageUrl(tags: Record<string, string>): Promise<string | null> {
    // 1. Direct image URL
    const imageTag = tags['image'];
    if (imageTag && imageTag.startsWith('http')) {
      return imageTag;
    }

    // 2. Wikimedia Commons file
    const commons = tags['wikimedia_commons'];
    if (commons) {
      const url = this.commonsFileToUrl(commons);
      if (url) return url;
    }

    // 3. Wikipedia article -> thumbnail
    const wiki = tags['wikipedia'];
    if (wiki) {
      const url = await this.resolveFromWikipedia(wiki);
      if (url) return url;
    }

    // 4. Wikidata entity -> P18 image claim
    const wikidata = tags['wikidata'];
    if (wikidata) {
      const url = await this.resolveFromWikidata(wikidata);
      if (url) return url;
    }

    return null;
  }

  private commonsFileToUrl(value: string): string | null {
    // Format: "File:Something.jpg" or "Category:Something"
    let filename = value;
    if (filename.startsWith('File:')) {
      filename = filename.slice(5);
    } else if (filename.startsWith('Category:')) {
      return null;
    }
    if (!filename) return null;
    const encoded = encodeURIComponent(filename.replace(/ /g, '_'));
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}?width=${THUMB_WIDTH}`;
  }

  private async resolveFromWikipedia(tag: string): Promise<string | null> {
    // Format: "en:Article Title" or "ro:Titlu Articol"
    const cacheKey = `thumb:wp:${tag}`;
    const cached = await this.cache.get<string>(cacheKey);
    if (cached) return cached;

    const colonIdx = tag.indexOf(':');
    if (colonIdx === -1) return null;

    const lang = tag.slice(0, colonIdx);
    const title = tag.slice(colonIdx + 1).trim();
    if (!lang || !title) return null;

    try {
      await this.delay();
      const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;

      const data = await res.json();
      const thumbUrl = data?.thumbnail?.source ?? null;
      if (thumbUrl) {
        await this.cache.set(cacheKey, thumbUrl, CACHE_TTL);
      }
      return thumbUrl;
    } catch (err) {
      this.logger.debug(`Wikipedia thumbnail resolve failed for "${tag}": ${err}`);
      return null;
    }
  }

  private async resolveFromWikidata(qid: string): Promise<string | null> {
    if (!qid.startsWith('Q')) return null;

    const cacheKey = `thumb:wd:${qid}`;
    const cached = await this.cache.get<string>(cacheKey);
    if (cached) return cached;

    try {
      await this.delay();
      const url = `https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${qid}&property=P18&format=json`;
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;

      const data = await res.json();
      const claims = data?.claims?.P18;
      if (!Array.isArray(claims) || claims.length === 0) return null;

      const filename = claims[0]?.mainsnak?.datavalue?.value;
      if (!filename) return null;

      const encoded = encodeURIComponent(filename.replace(/ /g, '_'));
      const thumbUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}?width=${THUMB_WIDTH}`;
      await this.cache.set(cacheKey, thumbUrl, CACHE_TTL);
      return thumbUrl;
    } catch (err) {
      this.logger.debug(`Wikidata thumbnail resolve failed for "${qid}": ${err}`);
      return null;
    }
  }

  private delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
  }
}
