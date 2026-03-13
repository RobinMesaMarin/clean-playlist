export default async (req) => {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return new Response('Missing playlist id', { status: 400 })

  try {
    const res = await fetch(`https://api.deezer.com/playlist/${id}`)
    if (!res.ok) return new Response('Impossible de charger la playlist Deezer.', { status: 502 })
    const data = await res.json()
    if (data.error) return new Response('Playlist Deezer introuvable ou privée.', { status: 404 })

    const title = data.title
    const tracks = []
    let next = `https://api.deezer.com/playlist/${id}/tracks?limit=200&index=0`

    while (next) {
      const r = await fetch(next)
      const page = await r.json()
      if (page.error || !page.data) break
      for (const track of page.data) {
        if (track.title && track.artist?.name) {
          tracks.push({ title: track.title, artist: track.artist.name })
        }
      }
      next = page.next ?? null
    }

    const artistNames = [...new Set(tracks.map((t) => t.artist))]
    return Response.json({ title, tracks, artistNames, trackCount: tracks.length })
  } catch (e) {
    return new Response(`Internal error: ${e.message}`, { status: 500 })
  }
}

export const config = { path: '/api/deezer-playlist' }
