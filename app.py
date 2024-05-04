from flask import Flask, render_template, request, jsonify
from pytube import Playlist, YouTube

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/playlist-info', methods=['POST'])
def playlist_info():
    data = request.json
    playlist_url = data['playlistUrl']

    try:
        pl = Playlist(playlist_url)
        video_count = len(pl.video_urls)

        # Get available video qualities
        video = YouTube(pl.video_urls[0])
        video_qualities = [stream.resolution for stream in video.streams.filter(file_extension='mp4').order_by('resolution').desc()]

        return jsonify({'videoCount': video_count, 'videoQualities': video_qualities})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download-videos', methods=['GET'])  # Ubah metode permintaan menjadi GET
def download_videos():
    playlist_url = request.args.get('playlistUrl')
    video_quality = request.args.get('videoQuality')
    video_count = int(request.args.get('videoCount'))

    try:
        pl = Playlist(playlist_url)
        remaining_video_count = 0

        for video_url in pl.video_urls[:video_count]:
            try:
                video = YouTube(video_url)
                stream = video.streams.filter(res=video_quality, file_extension='mp4').first()
                stream.download(output_path="D:/video_coba/")
            except Exception as e:
                print(f"Error downloading video: {str(e)}")
                remaining_video_count += 1

        downloaded = video_count - remaining_video_count
        return jsonify({'downloaded': downloaded, 'total': video_count})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
