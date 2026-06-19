import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Ticket } from "lucide-react";

const guestCards = [
  {
    image: "/assets/honored-guests/tito-mutai.jpg",
    alt: "Tito Mutai speaking at the 2026 - Africa International Agricultural Expo",
    name: "Tito Mutai",
    title: "Chief Executive Officer",
    org: "Agri Africa Exhibition Ltd.",
  },
  {
    image: "/assets/honored-guests/mutahi-kagwe.jpeg",
    alt: "Honorable Senator Mutahi Kagwe",
    name: "Hon. Sen. Mutahi Kagwe",
    title: "Cabinet Secretary",
    org: "Ministry of Agriculture & Livestock Development",
  },
  {
    image: "/assets/honored-guests/johnson-sakaja.jpeg",
    alt: "Governor Johnson Sakaja",
    name: "H.E. Johnson Sakaja",
    title: "Governor",
    org: "Nairobi City County",
  },
];

const objectives = [
  {
    title: "Showcase global innovation",
    copy: "Showcasing global agricultural innovations and technologies to the African continent.",
  },
  {
    title: "Highlight African capability",
    copy: "Highlighting Africa's capabilities and strengths in agriculture.",
  },
  {
    title: "Strengthen trade relationships",
    copy: "Strengthening mutually beneficial trade relationships between Africa and international partners.",
  },
  {
    title: "Promote investment",
    copy: "Identifying and promoting investment opportunities in Africa's agricultural sector.",
  },
];

const categories = [
  "Honey",
  "Mushroom",
  "Seed Propagation",
  "Poultry",
  "Dairy",
  "Livestock & Meat",
  "Animal Health",
  "Plant Health",
  "Herbs & Spices",
];

export function ExpoOverview({
  dates = "27–30 October 2026",
  venue = "KICC, Nairobi, Kenya",
  theme = "Improving agricultural productivity in Africa through innovations and market access.",
}: {
  dates?: string;
  venue?: string;
  theme?: string;
}) {
  return (
    <>
      <section className="overview-summary reveal in" aria-labelledby="overview-about-title">
        <div className="overview-summary-left">
          <div className="stat-grid">
            <div className="stat-cell">
              <span className="stat-num">10+</span>
              <span className="stat-lbl">Countries</span>
            </div>
            <div className="stat-cell">
              <span className="stat-num">200+</span>
              <span className="stat-lbl">Exhibitors</span>
            </div>
            <div className="stat-cell">
              <span className="stat-num">5,000+</span>
              <span className="stat-lbl">Visitors</span>
            </div>
            <div className="stat-cell">
              <span className="stat-num">10+</span>
              <span className="stat-lbl">Support Units</span>
            </div>
          </div>
          <div className="overview-summary-copy">
            <h2>A catalyst for lasting business and agricultural growth.</h2>
            <p>
              Agri Africa creates meaningful connections between visitors, exhibitors, buyers,
              innovators, and institutions, then helps nurture them toward value-creating outcomes.
            </p>
          </div>
        </div>
        <article className="overview-about-card">
          <span className="overview-tag">Event Details</span>
          <h2 id="overview-about-title">2026 - Africa International Agricultural Expo</h2>
          <dl className="overview-event-details">
            <div>
              <dt>Date</dt>
              <dd>{dates}</dd>
            </div>
            <div>
              <dt>Venue</dt>
              <dd>{venue}</dd>
            </div>
            <div>
              <dt>Theme</dt>
              <dd>{theme}</dd>
            </div>
          </dl>
          <div className="overview-objectives">
            <div className="overview-objectives-head">
              <h3>Event Objectives</h3>
              <span>What 2026 - AIAE is built to achieve</span>
            </div>
            <ul>
              {objectives.map((objective) => (
                <li key={objective.title}>
                  <strong>{objective.title}</strong>
                  <span>{objective.copy}</span>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </section>

      <div className="reveal in">
        <div className="expo-category-marquee" aria-label="Exhibition categories">
          <div className="expo-category-track">
            {[0, 1].map((copyIndex) => (
              <div className="expo-category-set" aria-hidden={copyIndex === 1} key={copyIndex}>
                {categories.map((category) => (
                  <span key={`${copyIndex}-${category}`}>
                    {category}
                    {category !== categories[categories.length - 1] ? <i /> : null}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="overview-section honored-section reveal in">
        <div className="overview-section-head">
          <div>
            <div className="eyebrow">Honored Guests</div>
            <h2>Leaders joining 2026 - AIAE</h2>
          </div>
          <p>
            Distinguished guests bringing leadership, industry experience, and a shared commitment
            to Africa&apos;s agricultural growth.
          </p>
        </div>
        <div className="guest-grid">
          {guestCards.map((guest) => (
            <article className="guest-card" key={guest.name}>
              <img src={guest.image} alt={guest.alt} />
              <div className="guest-copy">
                <h3>{guest.name}</h3>
                <span>{guest.title}</span>
                <p>{guest.org}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="visitor-cta-wrap reveal in">
        <div className="visitor-cta-pattern" aria-hidden="true" />
        <div className="visitor-cta-copy">
          <span className="q">
            <Ticket /> For Visitors
          </span>
          <h3>Experience 2026 - AIAE in Nairobi</h3>
          <p>
            Meet innovators, discover practical solutions, and connect with the people advancing
            African agriculture.
          </p>
          <div className="visitor-cta-meta">
            <span>
              <CalendarDays /> 27–30 October 2026
            </span>
            <span>
              <MapPin /> KICC, Nairobi
            </span>
          </div>
        </div>
        <div className="visitor-cta-action">
          <span>Visitor registration</span>
          <strong>Free</strong>
          <Link className="btn btn-light" href="/visitor-registration">
            Register to Attend <ArrowRight />
          </Link>
        </div>
      </div>
    </>
  );
}
