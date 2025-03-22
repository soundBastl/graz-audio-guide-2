// Graz Audio Guide Application Logic

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
    setupAudioControls();
    setupTourCards();
});

// Audio locations data - these would typically come from a backend API
const audioLocations = [
    {
        id: 1,
        name: "Hauptplatz",
        coordinates: [47.0707, 15.4382],
        description: "The bustling main square of Graz, where you can hear the sounds of street performers, tourists, and the famous clocktower bell.",
        audioFile: "audio/hauptplatz.mp3",
        tour: ["historical", "cultural"]
    },
    {
        id: 2,
        name: "Schlossberg",
        coordinates: [47.0763, 15.4379],
        description: "The iconic hill in the center of Graz with panoramic views. Listen to birds chirping and the sounds of the outdoor cafés.",
        audioFile: "audio/schlossberg.mp3",
        tour: ["historical", "nature"]
    },
    {
        id: 3,
        name: "Kunsthaus (Art Museum)",
        coordinates: [47.0716, 15.4350],
        description: "The modern 'Friendly Alien' art museum. Hear the unique acoustics inside this architectural marvel and the river Mur flowing nearby.",
        audioFile: "audio/kunsthaus.mp3",
        tour: ["cultural"]
    },
    {
        id: 4,
        name: "Mur Island",
        coordinates: [47.0730, 15.4321],
        description: "The floating platform on the Mur river with its café and amphitheater. Experience the calming sounds of water flowing around you.",
        audioFile: "audio/murinsel.mp3",
        tour: ["cultural", "nature"]
    },
    {
        id: 5,
        name: "Farmers Market (Kaiser-Josef-Platz)",
        coordinates: [47.0766, 15.4405],
        description: "The lively farmers market where locals shop for fresh produce. Immerse yourself in the sounds of vendors and customers haggling.",
        audioFile: "audio/farmersmarket.mp3",
        tour: ["culinary"]
    },
    {
        id: 6,
        name: "Stadtpark (City Park)",
        coordinates: [47.0721, 15.4476],
        description: "The green heart of Graz. Listen to the peaceful sounds of nature, children playing, and street musicians.",
        audioFile: "audio/stadtpark.mp3",
        tour: ["nature"]
    },
    {
        id: 7,
        name: "University of Graz",
        coordinates: [47.0780, 15.4490],
        description: "The historic campus buzzing with student life. Experience the ambiance of knowledge and academic discourse.",
        audioFile: "audio/university.mp3",
        tour: ["historical"]
    }
];

// Map variables
let map;
let audioMarkers = [];
let activeTour = null;
let currentAudio = null;
let audioContext;

// Initialize the map
function initializeMap() {
    // Center on Graz
    map = L.map('map-container').setView([47.0707, 15.4382], 14);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Add audio location markers
    addMarkers();
}

// Add markers for audio locations
function addMarkers() {
    // Clear existing markers
    audioMarkers.forEach(marker => map.removeLayer(marker));
    audioMarkers = [];
    
    // Custom marker icon
    const customIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
    
    // Add markers for each location
    audioLocations.forEach(location => {
        // Only show markers for the active tour, or all if no tour is selected
        if (!activeTour || location.tour.includes(activeTour)) {
            const marker = L.marker(location.coordinates, {
                icon: customIcon,
                title: location.name,
                riseOnHover: true,
                riseOffset: 250
            })
            .addTo(map)
            .bindPopup(createPopupContent(location));
            
            // Fix hover animation
            marker.on('mouseover', function() {
                if (this._icon) {
                    this._icon.style.transition = 'transform 0.3s ease';
                    this._icon.style.transform = this._icon.style.transform + ' translateY(-8px)';
                }
            });
            
            marker.on('mouseout', function() {
                if (this._icon) {
                    this._icon.style.transition = 'transform 0.3s ease';
                    // Reset only the Y translation, preserve other transforms
                    this._icon.style.transform = this._icon.style.transform.replace(/ translateY\([^)]+\)/g, '');
                }
            });
                
            marker.on('click', () => {
                displayLocationInfo(location);
            });
            
            audioMarkers.push(marker);
        }
    });
}

// Create popup content for markers
function createPopupContent(location) {
    const popupContent = document.createElement('div');
    popupContent.className = 'location-popup';
    
    const title = document.createElement('h3');
    title.textContent = location.name;
    
    const listenButton = document.createElement('button');
    listenButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
        </svg>
        Listen
    `;
    listenButton.onclick = () => {
        playAudio(location);
    };
    
    popupContent.appendChild(title);
    popupContent.appendChild(listenButton);
    
    return popupContent;
}

// Display location information in the sidebar
function displayLocationInfo(location) {
    const infoContainer = document.getElementById('location-info-content');
    infoContainer.innerHTML = '';
    
    const title = document.createElement('h4');
    title.textContent = location.name;
    
    const description = document.createElement('p');
    description.textContent = location.description;
    
    infoContainer.appendChild(title);
    infoContainer.appendChild(description);
    
    // Auto-play the audio for this location
    playAudio(location);
}

// Set up audio controls
function setupAudioControls() {
    const audioElement = document.getElementById('audio-element');
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const volumeControl = document.getElementById('volume');
    const playerEl = document.querySelector('.audio-player');
    
    // Initialize Web Audio API (not used directly but kept for future enhancements)
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
    } catch (e) {
        console.warn('Web Audio API is not supported in this browser');
    }
    
    // Set up event listeners for HTML5 audio element
    audioElement.addEventListener('canplaythrough', () => {
        console.log('Audio ready to play');
        document.getElementById('location-title').classList.remove('loading');
        playerEl.classList.remove('loading');
        playBtn.disabled = false;
    });
    
    audioElement.addEventListener('play', () => {
        console.log('Audio playback started');
        playBtn.disabled = true;
        pauseBtn.disabled = false;
        playerEl.classList.remove('paused', 'loading', 'error');
        playerEl.classList.add('playing');
        
        // Add visualization effect
        updatePlaybackAnimation(true);
    });
    
    audioElement.addEventListener('pause', () => {
        console.log('Audio playback paused');
        playBtn.disabled = false;
        pauseBtn.disabled = true;
        playerEl.classList.remove('playing', 'loading');
        playerEl.classList.add('paused');
        
        // Stop visualization
        updatePlaybackAnimation(false);
    });
    
    audioElement.addEventListener('ended', () => {
        console.log('Audio playback ended');
        playBtn.disabled = false;
        pauseBtn.disabled = true;
        playerEl.classList.remove('playing', 'loading');
        
        // Stop visualization
        updatePlaybackAnimation(false);
    });
    
    audioElement.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        document.getElementById('location-title').classList.remove('loading');
        playerEl.classList.remove('loading', 'playing');
        playerEl.classList.add('error');
        alert('Error playing audio: ' + getErrorMessageFromEvent(e));
    });
    
    // Set up control button event listeners
    playBtn.addEventListener('click', () => {
        console.log('Play button clicked');
        playerEl.classList.add('loading');
        audioElement.play().catch(error => {
            console.error('Error playing audio:', error);
            playerEl.classList.remove('loading');
            playerEl.classList.add('error');
        });
    });
    
    pauseBtn.addEventListener('click', () => {
        console.log('Pause button clicked');
        audioElement.pause();
    });
    
    volumeControl.addEventListener('input', (e) => {
        console.log('Volume changed to:', e.target.value);
        audioElement.volume = e.target.value;
        
        // Visual feedback for volume change
        const volumeLevel = Math.round(e.target.value * 100);
        volumeControl.setAttribute('title', `Volume: ${volumeLevel}%`);
        
        // Flash the volume control briefly
        volumeControl.classList.add('volume-changed');
        setTimeout(() => volumeControl.classList.remove('volume-changed'), 500);
    });
}

// Helper function to get error message from audio error event
function getErrorMessageFromEvent(event) {
    if (!event || !event.target || !event.target.error) {
        return 'Unknown error';
    }
    
    const error = event.target.error;
    switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
            return 'Playback aborted';
        case MediaError.MEDIA_ERR_NETWORK:
            return 'Network error';
        case MediaError.MEDIA_ERR_DECODE:
            return 'Decoding error - file might be corrupted';
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            return 'Format not supported';
        default:
            return `Unknown error (${error.code})`;
    }
}

// Play audio for a location
function playAudio(location) {
    console.log(`Attempting to play audio for ${location.name}: ${location.audioFile}`);
    
    // Get the audio element
    const audioElement = document.getElementById('audio-element');
    
    // Stop current audio if playing
    audioElement.pause();
    
    // Update UI to show loading state
    document.getElementById('location-title').textContent = `${location.name}`;
    document.getElementById('location-title').classList.add('loading');
    document.getElementById('play-btn').disabled = true;
    document.getElementById('pause-btn').disabled = true;
    
    // Add visual playback indicator
    const playerEl = document.querySelector('.audio-player');
    playerEl.classList.remove('playing', 'paused', 'error');
    playerEl.classList.add('loading');
    
    // Set the source to the new audio file
    audioElement.src = location.audioFile;
    
    // Set the volume based on the current volume control
    audioElement.volume = document.getElementById('volume').value;
    
    // Preload audio
    audioElement.load();
    
    // Try to play automatically after a short delay
    setTimeout(() => {
        console.log(`Calling play() for: ${location.audioFile}`);
        audioElement.play().catch(error => {
            console.error('Error playing audio:', error);
            document.getElementById('location-title').classList.remove('loading');
            playerEl.classList.remove('loading');
            playerEl.classList.add('error');
            alert('Could not play audio: ' + error.message);
        });
    }, 500); // Longer delay to ensure loading
}

// Set up tour card functionality
function setupTourCards() {
    const tourCards = document.querySelectorAll('.tour-card');
    
    tourCards.forEach(card => {
        card.addEventListener('click', () => {
            // Get tour type
            const tourType = card.getAttribute('data-tour');
            
            // Deactivate all cards
            tourCards.forEach(c => c.classList.remove('active-tour'));
            
            // If clicking the active tour, deselect it
            if (activeTour === tourType) {
                activeTour = null;
            } else {
                // Activate selected tour
                card.classList.add('active-tour');
                activeTour = tourType;
            }
            
            // Update markers
            addMarkers();
        });
    });
}

// Create audio visualization effect
function updatePlaybackAnimation(isPlaying) {
    const locationTitle = document.getElementById('location-title');
    
    if (isPlaying) {
        locationTitle.classList.add('playing');
    } else {
        locationTitle.classList.remove('playing');
    }
}