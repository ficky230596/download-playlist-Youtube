const playlistForm = document.getElementById('playlistForm');
const playlistInfoDiv = document.getElementById('playlistInfo');
const videoOptionsDiv = document.getElementById('videoOptions');
const videoQualitySelect = document.getElementById('videoQuality');
const videoCountInput = document.getElementById('videoCount');
const downloadVideosBtn = document.getElementById('downloadVideos');
const statusDiv = document.getElementById('status');
const loading = document.getElementById('loading');
const downloadStatus = document.getElementById('downloadStatus');
const progress = document.getElementById('progress');
const downloadTime = document.getElementById('downloadTime');
const downloadStatusText = document.createElement('div');
const timeRemaining = document.createElement('div');

// Event listener for form submission
playlistForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const playlistUrl = document.getElementById('playlistUrl').value;

    try {
        loading.style.display = 'block'; // Show loading animation
        const response = await fetch('/playlist-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ playlistUrl })
        });

        const data = await response.json();

        if (response.ok) {
            const options = data.videoQualities.map(quality => `<option value="${quality}">${quality}</option>`).join('');
            videoQualitySelect.innerHTML = options;
            playlistInfoDiv.innerHTML = `<p>Total videos in playlist: ${data.videoCount}</p>`;
            
            videoOptionsDiv.style.display = 'block';
            loading.style.display = 'none'; // Hide loading animation
        } else {
            statusDiv.textContent = `Error: ${data.error}`;
            loading.style.display = 'none'; // Hide loading animation
        }
    } catch (error) {
        console.error('Error:', error);
        statusDiv.textContent = 'An error occurred. Please try again later.';
        loading.style.display = 'none'; // Hide loading animation
    }
});

// Event listener for video download button
downloadVideosBtn.addEventListener('click', async () => {
    const playlistUrl = document.getElementById('playlistUrl').value;
    const videoQuality = videoQualitySelect.value;
    const videoCount = parseInt(videoCountInput.value);

    try {
        loading.style.display = 'block'; // Show loading animation
        progress.value = 0; // Reset progress bar
        downloadStatusText.textContent = 'Downloading...'; // Reset download status text
        timeRemaining.textContent = ''; // Reset time remaining

        const start = new Date().getTime(); // Start time of download process

        const eventSource = new EventSource(`/download-videos?playlistUrl=${encodeURIComponent(playlistUrl)}&videoQuality=${encodeURIComponent(videoQuality)}&videoCount=${videoCount}`);

        eventSource.onmessage = function(event) {
            const data = JSON.parse(event.data);
            if (data.error) {
                statusDiv.textContent = `Error: ${data.error}`;
            } else {
                statusDiv.textContent = `Download completed! ${data.downloaded} out of ${data.total} videos downloaded successfully.`;
                updateProgress(data.downloaded, data.total);
                updateEstimatedTimeRemaining(start, data.downloaded, data.total);
            }
        };

        eventSource.onerror = function() {
            console.error('EventSource failed.');
            eventSource.close();
            loading.style.display = 'none'; // Hide loading animation
            statusDiv.textContent = 'An error occurred. Please try again later.'; // Show error message
        };

        // Hide loading animation when download finishes
        eventSource.addEventListener('complete', () => {
            loading.style.display = 'none';
        });
    } catch (error) {
        console.error('Error:', error);
        statusDiv.textContent = 'An error occurred. Please try again later.';
        loading.style.display = 'none'; // Hide loading animation
    }
});

// Update progress bar and status text
function updateProgress(downloaded, total) {
    const progressValue = Math.round((downloaded / total) * 100);
    progress.value = progressValue;
    downloadStatusText.textContent = `Downloading... ${downloaded} out of ${total} videos downloaded.`;
}

// Update estimated time remaining
function updateEstimatedTimeRemaining(start, downloaded, total) {
    const timeNow = new Date().getTime();
    const elapsedTime = (timeNow - start) / 1000; // Elapsed time in seconds
    const videosRemaining = total - downloaded;
    const averageTimePerVideo = elapsedTime / downloaded;
    const estimatedTimeRemaining = Math.round(videosRemaining * averageTimePerVideo);
    timeRemaining.textContent = `Estimated time remaining: ${formatTime(estimatedTimeRemaining)}`;
}

// Format time in HH:MM:SS
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}


