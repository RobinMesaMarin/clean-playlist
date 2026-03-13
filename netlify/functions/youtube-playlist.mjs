const PAGES_PER_BATCH = 10 // 500 tracks per call, ~2-3s per batch

export default async (req) => {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const startToken = url.searchParams.get('pageToken') ?? ''
  if (!id) return new Response('Missing playlist id', { status: 400 })

  // Auto-generated playlists (Mixes, Radios) are not accessible via the API
  if (/^RD/i.test(id)) {
    return new Response(
      'Les playlists générées automatiquement par YouTube (Mix, Radio) ne sont pas supportées. Utilisez une playlist créée manuellement.',
      { status: 422 },
    )
  }

  const key = process.env.YOUTUBE_API_KEY
  const base = 'https://www.googleapis.com/youtube/v3'

  const itemsUrl = (token = '') =>
    `${base}/playlistItems?part=snippet&playlistId=${id}&maxResults=50` +
    `&fields=nextPageToken,items(snippet(title,videoOwnerChannelTitle))&key=${key}` +
    (token ? `&pageToken=${token}` : '')

  try {
    // Only fetch playlist title on the first call
    const [infoRes, firstPageRes] = await Promise.all([
      startToken
        ? Promise.resolve(null)
        : fetch(`${base}/playlists?part=snippet&id=${id}&fields=items(snippet(title))&key=${key}`),
      fetch(itemsUrl(startToken)),
    ])

    const [info, firstPage] = await Promise.all([
      infoRes ? infoRes.json() : Promise.resolve(null),
      firstPageRes.json(),
    ])

    if (info?.error) return new Response(`YouTube API error: ${info.error.message}`, { status: 502 })
    if (info && !info.items?.length) return new Response(`Playlist introuvable ou privée (id: ${id})`, { status: 404 })
    if (firstPage.error) return new Response(`YouTube API error: ${firstPage.error.message}`, { status: 502 })

    const title = info ? info.items[0].snippet.title : null
    const tracks = []

    const extractTracks = (items) => {
      for (const item of items ?? []) {
        const trackTitle = item.snippet?.title
        let artist = item.snippet?.videoOwnerChannelTitle ?? ''
        artist = artist.replace(/\s*-\s*Topic$/i, '').trim()
        if (trackTitle && artist) tracks.push({ title: trackTitle, artist })
      }
    }

    extractTracks(firstPage.items)

    let pageToken = firstPage.nextPageToken ?? null
    let pagesLeft = PAGES_PER_BATCH - 1

    while (pageToken && pagesLeft > 0) {
      const data = await fetch(itemsUrl(pageToken)).then((r) => r.json())
      if (data.error) break
      extractTracks(data.items)
      pageToken = data.nextPageToken ?? null
      pagesLeft--
    }

    return Response.json({ title, tracks, nextPageToken: pageToken })
  } catch (e) {
    return new Response(`Internal error: ${e.message}`, { status: 500 })
  }
}

export const config = { path: '/api/youtube-playlist' }
