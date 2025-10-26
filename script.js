(function() {
    if (typeof window.watchPageData === 'undefined') {
        console.error("CRITICAL: window.watchPageData is not defined.");
        return;
    }
    let pageData;
    try {
        pageData = JSON.parse(window.watchPageData);
    } catch (e) {
        console.error("CRITICAL: Error parsing JSON data from window.watchPageData.", e);
        document.body.innerHTML = '<h1 style="color:red; text-align:center; padding-top: 50px;">Error: Invalid JSON string format in the blog post.</h1>';
        return;
    }
    const contentData = pageData.seasons;
    const root = document.getElementById('watch-page-root');
    function renderPageStructure() {
        const pageHTML = `
            <div class="watch-page-container">
                <section class="hero-section">
                    <div class="background-image"><img src="${pageData.poster}" alt="${pageData.title} Poster"/></div>
                    <div class="gradient-overlay"></div>
                    <div class="hero-content">
                        <h1 class="show-title">${pageData.title}</h1>
                        <div class="metadata">
                            <span>${pageData.year}</span><span class="dot"></span>
                            <span>${pageData.genre}</span><span class="dot"></span>
                            <span class="rating">${pageData.rating || 'U/A 13+'}</span><span class="dot"></span>
                            <span id="totalSeasons">${contentData.length} Season${contentData.length > 1 ? 's' : ''}</span>
                        </div>
                        <p class="description">${pageData.description}</p>
                        <div class="language"><i class="fa-solid fa-volume-high"></i><span>${pageData.language}</span></div>
                        <div class="actions">
                            <button class="btn-primary" id="watchNowBtn">
                                <i class="fa-solid fa-play"></i>
                                <span id="watchNowText">Watch Now</span>
                            </button>
                            <div class="action-item" id="bingeListBtn"><button class="btn-icon"><i class="fa-solid fa-plus"></i></button><span>My Binge List</span></div>
                            <div class="action-item" id="whatsappBtn"><button class="btn-icon"><i class="fa-brands fa-whatsapp"></i></button><span>Whatsapp</span></div>
                            <div class="action-item" id="shareBtn"><button class="btn-icon"><i class="fa-solid fa-share-nodes"></i></button><span>Share</span></div>
                        </div>
                    </div>
                </section>
                <section class="episodes-section">
                    <div class="season-tabs" id="seasonTabs"></div>
                    <div class="carousel-container">
                        <button class="carousel-btn prev" id="prevEpisodeBtn"><i class="fa-solid fa-chevron-left"></i></button>
                        <div class="episode-list-wrapper">
                            <div class="episode-list" id="episodeList"></div>
                        </div>
                        <button class="carousel-btn next" id="nextEpisodeBtn"><i class="fa-solid fa-chevron-right"></i></button>
                    </div>
                </section>
            </div>
            <div class="popup-overlay" id="videoPopupOverlay">
                <div class="popup-content">
                    <div class="popup-header">
                        <h3 id="popupTitle"></h3>
                        <button class="close-btn" id="closePopupBtn"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="video-container">
                        <div class="loader" id="videoLoader"></div>
                        <video id="customPlayer" style="display:none;" controls=""></video>
                        <iframe id="iframePlayer" style="display:none;" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen=""></iframe>
                    </div>
                    <div class="server-controls">
                        <label for="serverSelector">Choose Server:</label>
                        <select id="serverSelector"></select>
                    </div>
                </div>
            </div>
        `;
        root.innerHTML = pageHTML;
    }
    renderPageStructure();
    const getEl = (id) => document.getElementById(id);
    const watchNowBtn = getEl('watchNowBtn'), watchNowText = getEl('watchNowText'), bingeListBtn = getEl('bingeListBtn'), whatsappBtn = getEl('whatsappBtn'), shareBtn = getEl('shareBtn'), seasonTabsContainer = getEl('seasonTabs'), episodeListContainer = getEl('episodeList'), popupOverlay = getEl('videoPopupOverlay'), closePopupBtn = getEl('closePopupBtn'), popupTitle = getEl('popupTitle'), serverSelector = getEl('serverSelector'), videoLoader = getEl('videoLoader'), customPlayer = getEl('customPlayer'), iframePlayer = getEl('iframePlayer'), prevEpisodeBtn = getEl('prevEpisodeBtn'), nextEpisodeBtn = getEl('nextEpisodeBtn');
    const episodeListWrapper = document.querySelector('.episode-list-wrapper');
    const carouselContainer = document.querySelector('.carousel-container');
    let currentEpisode = {};
    let lastWatched = null;
    const SHOW_ID = `${pageData.title.replace(/\s+/g, '_')}_lastWatched`;
    const isLocalStorageAvailable = () => { try { const t = "__test__"; localStorage.setItem(t, t); localStorage.removeItem(t); return true; } catch (e) { return false; } };
    const loadLastWatched = () => { if (!isLocalStorageAvailable()) return; try { const data = localStorage.getItem(SHOW_ID); if (data) { lastWatched = JSON.parse(data); const seasonData = contentData[lastWatched.seasonIndex]; const episodeData = seasonData?.episodes[lastWatched.episodeIndex]; if (episodeData) watchNowText.textContent = `Continue S${seasonData.season}:E${episodeData.episodeNumber}`; else lastWatched = null; } } catch (e) { console.error("Could not load from localStorage:", e); } if (!lastWatched) watchNowText.textContent = "Watch Now"; };
    const saveLastWatched = (seasonIndex, episodeIndex, time = 0) => { if (!isLocalStorageAvailable()) return; try { lastWatched = { seasonIndex, episodeIndex, time }; localStorage.setItem(SHOW_ID, JSON.stringify(lastWatched)); const seasonData = contentData[seasonIndex]; const episodeData = seasonData.episodes[episodeIndex]; watchNowText.textContent = `Continue S${seasonData.season}:E${episodeData.episodeNumber}`; } catch (e) { console.error("Could not save to localStorage:", e); } };
    const renderSeasonTabs = () => { if (!seasonTabsContainer) return; seasonTabsContainer.innerHTML = ''; contentData.forEach((seasonData, index) => { const tab = document.createElement('button'); tab.className = 'season-tab'; tab.textContent = `Season ${seasonData.season}`; tab.dataset.index = index; if (index === 0) tab.classList.add('active'); seasonTabsContainer.appendChild(tab); }); };
    const updateCarouselButtons = () => { if(!episodeListWrapper) return; setTimeout(() => { const showButtons = episodeListWrapper.scrollWidth > episodeListWrapper.clientWidth; if (carouselContainer) carouselContainer.classList.toggle('show-buttons', showButtons); if(prevEpisodeBtn) prevEpisodeBtn.disabled = episodeListWrapper.scrollLeft < 10; if(nextEpisodeBtn) nextEpisodeBtn.disabled = episodeListWrapper.scrollLeft + episodeListWrapper.clientWidth >= episodeListWrapper.scrollWidth - 10; }, 100); };
    const renderEpisodes = (seasonIndex) => { if (!episodeListContainer) return; episodeListContainer.innerHTML = ''; const season = contentData[seasonIndex]; if (!season) return; season.episodes.forEach((episode, episodeIndex) => { const card = document.createElement('div'); card.className = 'episode-card'; card.dataset.seasonIndex = seasonIndex; card.dataset.episodeIndex = episodeIndex; if (lastWatched && lastWatched.seasonIndex == seasonIndex && lastWatched.episodeIndex == episodeIndex) card.classList.add('last-watched'); card.innerHTML = `<div class="thumbnail"><img src="${episode.thumbnail}" alt="Episode ${episode.episodeNumber}"/><span class="duration">${episode.duration}</span><div class="play-overlay"><i class="fa-solid fa-play"></i></div><div class="episode-info"><p>${pageData.title} S${season.season} • Episode ${episode.episodeNumber} • ${episode.title}</p></div></div>`; episodeListContainer.appendChild(card); }); updateCarouselButtons(); };
    const scrollCarousel = (direction) => { if(!episodeListWrapper) return; const scrollAmount = episodeListWrapper.clientWidth * 0.8; episodeListWrapper.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' }); };
    const loadVideo = (server, startTime=0) => { if(!videoLoader || !customPlayer || !iframePlayer) return; videoLoader.style.display = 'block'; customPlayer.style.display = 'none'; iframePlayer.style.display = 'none'; customPlayer.pause(); iframePlayer.src = 'about:blank'; customPlayer.src = ''; if (!server) { videoLoader.style.display = 'none'; return; }; setTimeout(() => { if (server.type === 'video') { customPlayer.src = server.url; customPlayer.currentTime = startTime; customPlayer.style.display = 'block'; customPlayer.play().catch(e=>console.log("Autoplay blocked")); } else if (server.type === 'iframe') { let url = server.url; if (url.includes("youtube.com")) url += `${url.includes('?') ? '&' : '?'}autoplay=1&start=${Math.floor(startTime)}`; else url += `${url.includes('?') ? '&' : '?'}autoplay=1`; iframePlayer.src = url; iframePlayer.style.display = 'block'; } videoLoader.style.display = 'none'; }, 500); };
    const closePopup = () => { if (currentEpisode.seasonIndex !== undefined) { if (customPlayer && customPlayer.style.display !== 'none' && !customPlayer.paused) saveLastWatched(currentEpisode.seasonIndex, currentEpisode.episodeIndex, customPlayer.currentTime); else if (iframePlayer && iframePlayer.style.display !== 'none') saveLastWatched(currentEpisode.seasonIndex, currentEpisode.episodeIndex, 0); } if (popupOverlay) popupOverlay.style.display = 'none'; loadVideo(null); document.querySelectorAll('.episode-card.active').forEach(c => c.classList.remove('active')); document.querySelectorAll('.last-watched').forEach(c => c.classList.remove('last-watched')); if (lastWatched) { const lastWatchedCard = document.querySelector(`.episode-card[data-season-index='${lastWatched.seasonIndex}'][data-episode-index='${lastWatched.episodeIndex}']`); if (lastWatchedCard) lastWatchedCard.classList.add('last-watched'); } };
    const openPopup = (seasonIndex, episodeIndex) => { const season = contentData[seasonIndex]; const episode = season?.episodes[episodeIndex]; if (!episode) { alert("Sorry, this episode is not available."); return; } currentEpisode = { seasonIndex: parseInt(seasonIndex), episodeIndex: parseInt(episodeIndex) }; if(popupTitle) popupTitle.textContent = `You're watching Season ${season.season} - Episode ${episode.episodeNumber} - ${episode.title}`; if(serverSelector) serverSelector.innerHTML = ''; episode.servers.forEach((server, index) => { const option = document.createElement('option'); option.value = index; option.textContent = server.name; serverSelector.appendChild(option); }); let startTime = 0; if (lastWatched && lastWatched.seasonIndex == seasonIndex && lastWatched.episodeIndex == episodeIndex) startTime = lastWatched.time || 0; loadVideo(episode.servers[0], startTime); document.querySelectorAll('.episode-card.active').forEach(c => c.classList.remove('active')); const activeCard = document.querySelector(`.episode-card[data-season-index='${seasonIndex}'][data-episode-index='${episodeIndex}']`); if (activeCard) activeCard.classList.add('active'); if(popupOverlay) popupOverlay.style.display = 'flex'; };
    if(watchNowBtn) watchNowBtn.addEventListener('click', () => { if (lastWatched && lastWatched.seasonIndex !== undefined) openPopup(lastWatched.seasonIndex, lastWatched.episodeIndex); else openPopup(0, 0); });
    if(seasonTabsContainer) seasonTabsContainer.addEventListener('click', (e) => { const tab = e.target.closest('.season-tab'); if (tab) { document.querySelectorAll('.season-tab').forEach(t => t.classList.remove('active')); tab.classList.add('active'); renderEpisodes(tab.dataset.index); } });
    if(episodeListContainer) episodeListContainer.addEventListener('click', (e) => { const card = e.target.closest('.episode-card'); if (card) openPopup(card.dataset.seasonIndex, card.dataset.episodeIndex); });
    if(serverSelector) serverSelector.addEventListener('change', () => { const server = contentData[currentEpisode.seasonIndex].episodes[currentEpisode.episodeIndex].servers[serverSelector.value]; loadVideo(server, 0); });
    if(closePopupBtn) closePopupBtn.addEventListener('click', closePopup);
    if(popupOverlay) popupOverlay.addEventListener('click', (e) => { if (e.target === popupOverlay) closePopup(); });
    if(prevEpisodeBtn) prevEpisodeBtn.addEventListener('click', () => scrollCarousel(-1));
    if(nextEpisodeBtn) nextEpisodeBtn.addEventListener('click', () => scrollCarousel(1));
    if(episodeListWrapper) episodeListWrapper.addEventListener('scroll', updateCarouselButtons);
    window.addEventListener('resize', updateCarouselButtons);
    if(bingeListBtn) bingeListBtn.addEventListener('click', () => { alert('Added to your Binge List!'); const icon = bingeListBtn.querySelector('i'); if(icon) { icon.classList.toggle('fa-plus'); icon.classList.toggle('fa-check'); } });
    if(whatsappBtn) whatsappBtn.addEventListener('click', () => { const message = `Check out this show: ${pageData.title}. Watch it here: ${window.location.href}`; window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank'); });
    if(shareBtn) shareBtn.addEventListener('click', () => { if (navigator.share) { navigator.share({ title: pageData.title, text: 'Check out this awesome show!', url: window.location.href, }).catch(console.error); } else { alert('Share functionality is not supported. You can manually copy the link.'); } });
    if(customPlayer) customPlayer.addEventListener('timeupdate', () => { if (customPlayer.currentTime > 0 && Math.round(customPlayer.currentTime) % 10 === 0 && currentEpisode.seasonIndex !== undefined) saveLastWatched(currentEpisode.seasonIndex, currentEpisode.episodeIndex, customPlayer.currentTime); });
    loadLastWatched();
    renderSeasonTabs();
    renderEpisodes(0);
})();
