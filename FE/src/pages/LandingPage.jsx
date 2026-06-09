import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import BenefitsSection from '../components/landing/BenefitsSection.jsx';
import CTASection from '../components/landing/CTASection.jsx';
import CustomerTypes from '../components/landing/CustomerTypes.jsx';
import FeaturedProducts from '../components/landing/FeaturedProducts.jsx';
import Footer from '../components/landing/Footer.jsx';
import HeroSection from '../components/landing/HeroSection.jsx';
import Navbar from '../components/landing/Navbar.jsx';
import OrderProcess from '../components/landing/OrderProcess.jsx';
import ProductCategories from '../components/landing/ProductCategories.jsx';
import Testimonials from '../components/landing/Testimonials.jsx';
import '../styles/ngocanh-landing.css';
import { getAuth } from '../utils/authStorage.js';

gsap.registerPlugin(ScrollTrigger);

function LandingPage() {
  const rootRef = useRef(null);
  const auth = getAuth();

  useLayoutEffect(() => {
    if (auth?.token) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;

    const ctx = gsap.context(() => {
      const heroTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
      heroTimeline
        .from('.pi-navbar', { y: -40, opacity: 0, duration: 0.7 })
        .from('.pi-hero-kicker', { y: 18, opacity: 0, duration: 0.55 }, '-=0.25')
        .from('.pi-hero-title span', { yPercent: 105, scale: 0.92, opacity: 0, duration: 0.78, stagger: 0.08 }, '-=0.18')
        .from('.pi-hero-copy', { y: 24, opacity: 0, duration: 0.55 }, '-=0.38')
        .from('.pi-hero-actions .pi-btn', { y: 20, opacity: 0, duration: 0.45, stagger: 0.08 }, '-=0.25')
        .from('.pi-hero-badge', { y: 18, opacity: 0, scale: 0.88, duration: 0.4, stagger: 0.07 }, '-=0.1')
        .from('.pi-hero-visual', { x: 90, rotate: 4, opacity: 0, duration: 0.9 }, '-=0.85');

      gsap.to('.pi-navbar', {
        scrollTrigger: {
          trigger: '.pi-landing',
          start: 'top top',
          end: '+=220',
          scrub: true,
        },
        scale: 0.965,
        y: 8,
        boxShadow: '0 18px 46px rgba(16, 72, 100, 0.18)',
      });

      gsap.to('.pi-hero-title', {
        yPercent: -18,
        scrollTrigger: {
          trigger: '.pi-hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.9,
        },
      });

      gsap.to('.pi-hero-visual', {
        yPercent: 14,
        xPercent: -7,
        rotate: -5,
        scrollTrigger: {
          trigger: '.pi-hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.9,
        },
      });

      gsap.to('.pi-blob-a', {
        xPercent: 20,
        yPercent: -18,
        rotate: 16,
        scrollTrigger: {
          trigger: '.pi-hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });

      gsap.to('.pi-frost-dot', {
        y: -90,
        x: 34,
        stagger: 0.05,
        scrollTrigger: {
          trigger: '.pi-hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1.1,
        },
      });

      const categoryTrack = document.querySelector('.pi-category-track');
      if (categoryTrack) {
        const amount = Math.max(0, categoryTrack.scrollWidth - window.innerWidth + 48);
        gsap.to(categoryTrack, {
          x: -amount,
          ease: 'none',
          scrollTrigger: {
            trigger: '.pi-categories',
            start: 'top top',
            end: () => `+=${Math.max(amount, 900)}`,
            scrub: 0.85,
            pin: true,
            invalidateOnRefresh: true,
          },
        });

        gsap.from('.pi-category-card', {
          y: 120,
          opacity: 0,
          rotate: 3,
          stagger: 0.12,
          scrollTrigger: {
            trigger: '.pi-categories',
            start: 'top 65%',
            end: 'top 10%',
            scrub: true,
          },
        });
      }

      gsap.from('.pi-product-card', {
        y: 80,
        opacity: 0,
        scale: 0.92,
        rotateX: 8,
        stagger: 0.09,
        scrollTrigger: {
          trigger: '.pi-products',
          start: 'top 72%',
          end: 'center center',
          scrub: 0.6,
        },
      });

      gsap.from('.pi-benefit-panel', {
        clipPath: 'inset(0 50% 0 50% round 32px)',
        y: 56,
        opacity: 0.4,
        stagger: 0.08,
        scrollTrigger: {
          trigger: '.pi-benefits',
          start: 'top 70%',
          end: 'center center',
          scrub: 0.8,
        },
      });

      gsap.to('.pi-process-line-fill', {
        scaleX: 1,
        transformOrigin: 'left center',
        ease: 'none',
        scrollTrigger: {
          trigger: '.pi-process',
          start: 'top 72%',
          end: 'bottom 45%',
          scrub: true,
        },
      });

      gsap.from('.pi-process-step', {
        y: 46,
        opacity: 0,
        stagger: 0.12,
        scrollTrigger: {
          trigger: '.pi-process',
          start: 'top 68%',
          end: 'center center',
          scrub: 0.5,
        },
      });

      gsap.from('.pi-customer-card', {
        x: (index) => (index % 2 === 0 ? -70 : 70),
        opacity: 0,
        stagger: 0.08,
        scrollTrigger: {
          trigger: '.pi-customers',
          start: 'top 72%',
          end: 'center center',
          scrub: 0.5,
        },
      });

      gsap.from('.pi-review-card', {
        y: 64,
        opacity: 0,
        rotate: (index) => (index % 2 === 0 ? -2 : 2),
        stagger: 0.12,
        scrollTrigger: {
          trigger: '.pi-testimonials',
          start: 'top 72%',
          end: 'center center',
          scrub: 0.55,
        },
      });

      gsap.to('.pi-cta-wave', {
        xPercent: -18,
        scrollTrigger: {
          trigger: '.pi-cta',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      });
    }, rootRef);

    return () => ctx.revert();
  }, [auth?.token]);

  return (
    <div className="pi-landing" ref={rootRef}>
      <Navbar />
      <main>
        <HeroSection />
        <ProductCategories />
        <FeaturedProducts />
        <BenefitsSection />
        <OrderProcess />
        <CustomerTypes />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

export default LandingPage;
