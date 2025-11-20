export default async function decorate(block) {
    // 1. Create Structure
    const container = document.createElement('div');
    container.classList.add('video-tab-container');
  
    // 2. Hardcoded Heading
    const header = document.createElement('div');
    header.classList.add('video-tab-header');
    header.innerHTML = '<h2>Popular Videos</h2>';
    block.parentElement.prepend(header);
  
    // 3. Process Slides
    const slidesWrapper = document.createElement('div');
    slidesWrapper.classList.add('video-tab-slides');
  
    const getYouTubeId = (url) => {
      const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
      return match ? match[1] : null;
    };
  
    [...block.children].forEach((row, index) => {
      const slide = document.createElement('div');
      slide.classList.add('video-tab-slide');
      if (index === 0) slide.classList.add('active');
  
      // Extract Link & Image
      const linkEl = row.querySelector('a');
      const videoLink = linkEl?.href;
      const posterImage = row.querySelector('img')?.src;
  
      if (videoLink) {
        const ytId = getYouTubeId(videoLink);
  
        if (ytId) {
          // --- YOUTUBE LOGIC ---
          const iframe = document.createElement('iframe');
          // enablejsapi=1 allows us to pause it via code
          iframe.src = `https://www.youtube.com/embed/${ytId}?enablejsapi=1&rel=0`; 
          iframe.setAttribute('allow', 'autoplay; encrypted-media; accelerometer; gyroscope; picture-in-picture');
          iframe.setAttribute('allowfullscreen', '');
          slide.append(iframe);
        } else {
          // --- MP4 LOGIC (Fallback) ---
          const video = document.createElement('video');
          video.src = videoLink;
          video.controls = true;
          video.preload = 'metadata';
          if (posterImage) video.poster = posterImage;
          slide.append(video);
        }
      }
  
      slidesWrapper.append(slide);
    });
  
    container.append(slidesWrapper);
  
    // 4. Navigation (Arrows)
    const prevBtn = document.createElement('button');
    prevBtn.classList.add('video-nav', 'prev');
    prevBtn.innerHTML = '&#10094;'; 
  
    const nextBtn = document.createElement('button');
    nextBtn.classList.add('video-nav', 'next');
    nextBtn.innerHTML = '&#10095;'; 
  
    // 5. Pagination (Dots)
    const dotsContainer = document.createElement('div');
    dotsContainer.classList.add('video-tab-dots');
    
    const slides = slidesWrapper.querySelectorAll('.video-tab-slide');
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.classList.add('video-dot');
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer.append(dot);
    });
  
    // --- Carousel Logic ---
    let currentIndex = 0;
  
    function goToSlide(index) {
      if (index < 0) index = slides.length - 1;
      if (index >= slides.length) index = 0;
      
      // PAUSE CURRENT VIDEO before switching
      // (Prevents audio from playing in background)
      const currentSlide = slides[currentIndex];
      const currentIframe = currentSlide.querySelector('iframe');
      const currentVideo = currentSlide.querySelector('video');
  
      if (currentIframe) {
        // Send YouTube command to pause
        currentIframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      } else if (currentVideo) {
        currentVideo.pause();
      }
  
      currentIndex = index;
  
      // Update Classes
      slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === currentIndex);
      });
  
      const dots = dotsContainer.querySelectorAll('.video-dot');
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
      });
    }
  
    prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
    nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));
  
    // Assemble
    container.append(prevBtn, nextBtn, dotsContainer);
    block.innerHTML = '';
    block.append(container);
  }