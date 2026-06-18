
import { useEffect, useRef, useState } from "react";
const tabs = [{
  id: 1,
  title: "Innovative Design",
  description: "Creating unique architectural solutions that push boundaries",
  videoSrc: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop"
}, {
  id: 2,
  title: "Sustainable Architecture",
  description: "Eco-friendly approaches for a better tomorrow",
  videoSrc: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop"
}, {
  id: 3,
  title: "Urban Planning",
  description: "Comprehensive solutions for modern cities",
  videoSrc: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2053&auto=format&fit=crop"
}, {
  id: 4,
  title: "Interior Design",
  description: "Crafting beautiful spaces that inspire",
  videoSrc: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=2070&auto=format&fit=crop"
}];
const StickySection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState(1);
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const sectionTop = sectionRef.current.offsetTop;
      const sectionHeight = sectionRef.current.clientHeight;
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      // Calculate which tab should be active based on scroll position
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight - windowHeight) {
        const scrollProgress = (scrollY - sectionTop) / (sectionHeight - windowHeight);
        const tabIndex = Math.min(Math.floor(scrollProgress * tabs.length) + 1, tabs.length);
        setActiveTab(tabIndex);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return <section ref={sectionRef} className="section_tabs padding-section-large tabs_height">
      <div className="tabs_sticky-wrapper">
        <div className="tabs_container">
          <div className="tabs_component">
            <div className="tabs_left bg-vs-dark/90">
              <div className="tabs_left-top">
                {tabs.map(tab => <div key={tab.id} className={`tabs_let-content ${activeTab === tab.id ? 'is-1' : ''}`}>
                    <h2 className="heading-style-h4 text-color-gray100 font-syne">{tab.title}</h2>
                    <div className="tabs_line bg-vs-light/50"></div>
                    <p className="text-color-gray400 text-size-small font-syne">{tab.description}</p>
                  </div>)}
              </div>

              <div className="tabs_left-bottom">
                <a href="/contact" className="button is-white is-secondary hover-this group">
                  <div className="button-text font-syne text-white">Learn More</div>
                  <div className="button-circle-wrapper">
                    <div className="button-icon arrow-icon text-white group-hover:translate-x-1 transition-transform">→</div>
                    <div className="button-circlee bg-vs hover:bg-vs-light transition-colors"></div>
                  </div>
                </a>
              </div>
            </div>

            <div className="tabs_right">
              {tabs.map(tab => <div key={tab.id} className={`w-background-video tabs_video ${activeTab === tab.id ? 'is-1' : ''}`} style={{
              backgroundImage: `url(${tab.videoSrc})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }} />)}
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default StickySection;
