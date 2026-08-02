const axios = require('axios');

class KomikcastV3 {
    static async search(query) {
        try {
            const url = `https://be.komikcast.cc/series?title=${encodeURIComponent(query)}`;
            const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            
            if (data && data.data) {
                return data.data.map(item => ({
                    title: item.data.title,
                    nativeTitle: item.data.nativeTitle,
                    slug: item.data.slug,
                    link: `https://v3.komikcast.fit/series/${item.data.slug}`,
                    cover: item.data.coverImage,
                    author: item.data.author,
                    format: item.data.format,
                    rating: item.data.rating,
                    status: item.data.status,
                    synopsis: item.data.synopsis
                }));
            }
            return [];
        } catch (error) {
            console.error('Error during search:', error.message);
            return [];
        }
    }

    static async detail(slugOrUrl) {
        try {
            const slug = slugOrUrl.split('/').pop();
            const url = `https://be.komikcast.cc/series/${slug}`;
            const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });

            if (data && data.data) {
                const s = data.data.data;
                return {
                    title: s.title,
                    nativeTitle: s.nativeTitle,
                    slug: s.slug,
                    author: s.author,
                    format: s.format,
                    rating: s.rating,
                    status: s.status,
                    cover: s.coverImage,
                    synopsis: s.synopsis,
                    genres: s.genreIds
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching detail:', error.message);
            return null;
        }
    }

    static async chapter(slugOrUrl) {
        try {
            const slug = slugOrUrl.split('/').pop();
            const url = `https://be.komikcast.cc/series/${slug}/chapters`;
            const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });

            if (data && data.data) {
                return data.data.map(ch => ({
                    id: ch.id,
                    number: `Chapter ${ch.data.index}`,
                    index: ch.data.index,
                    releaseDate: ch.createdAt,
                    views: ch.views?.total,
                    url: `https://v3.komikcast.fit/series/${slug}/chapter/${ch.data.index}`
                }));
            }
            return [];
        } catch (error) {
            console.error('Error fetching chapters:', error.message);
            return [];
        }
    }
}

(async () => {
    console.log('--- TESTING SEARCH ---');
    const searchRes = await KomikcastV3.search('solo');
    console.log(`Found ${searchRes.length} results:`);
    console.log(searchRes[0]);

    if (searchRes.length > 0) {
        const slug = searchRes[0].slug;
        console.log('\n--- TESTING DETAIL ---');
        const detailRes = await KomikcastV3.detail(slug);
        console.log(detailRes);

        console.log('\n--- TESTING CHAPTERS ---');
        const chaptersRes = await KomikcastV3.chapter(slug);
        console.log(`Found ${chaptersRes.length} chapters. Latest:`);
        console.log(chaptersRes[0]);
    }
})();
