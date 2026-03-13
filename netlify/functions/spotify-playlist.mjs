export default async (req) => {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return new Response('Missing playlist id', { status: 400 })

  try {
    const creds = btoa(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
    )
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })
    if (!tokenRes.ok) return new Response('Spotify auth failed', { status: 502 })
    const { access_token } = await tokenRes.json()

    const headers = { Authorization: `Bearer ${access_token}` }
    const [playlistRes, tracksRes] = await Promise.all([
      fetch(`https://api.spotify.com/v1/playlists/${id}?fields=name`, { headers }),
      fetch(
        `https://api.spotify.com/v1/playlists/${id}/tracks?limit=100&fields=items(track(name,artists(name))),next`,
        { headers },
      ),
    ])

    if (!playlistRes.ok) {
      const body = await playlistRes.text()
      return new Response(`Spotify playlist error ${playlistRes.status}: ${body}`, { status: playlistRes.status })
    }

    const playlist = await playlistRes.json()
    let page = await tracksRes.json()

    const tracks = []
    const add = (items) => {
      for (const i of items ?? []) {
        if (i?.track?.name && i?.track?.artists?.[0]?.name) {
          tracks.push({ title: i.track.name, artist: i.track.artists[0].name })
        }
      }
    }

    add(page.items)
    while (page.next) {
      const r = await fetch(page.next, { headers })
      page = await r.json()
      add(page.items)
    }

    const artistNames = [...new Set(tracks.map((t) => t.artist))]
    return Response.json({ title: playlist.name, tracks, artistNames, trackCount: tracks.length })
  } catch (e) {
    return new Response(`Internal error: ${e.message}`, { status: 500 })
  }
}

export const config = { path: '/api/spotify-playlist' }
