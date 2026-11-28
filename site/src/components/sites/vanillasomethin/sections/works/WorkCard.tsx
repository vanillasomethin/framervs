import Image from "next/image";

export type Work = {
  client: string;
  title: string;
  category: string;
  href: string;
  image: string;
  position: string;
};

/**
 * Selected Works card.
 * Desktop: 600px tall, radius 8, image cover; a 55px caption bar centred vertically with a 5px
 * backdrop blur (client left, title centred in the remaining space, category right, #fafafa).
 * Hover: image scale 1.1 + brightness .5 (~0.3s ease-in-out, sampled live); the custom cursor
 * turns into the VIEW pill via data-cursor="view".
 * Mobile: image 541px, then title (h5) and category (Inter 12/18) left-aligned below, no bar.
 */
export function WorkCard({ work, priority = false }: { work: Work; priority?: boolean }) {
  return (
    <a
      href={work.href}
      data-cursor="view"
      className="group flex h-[600px] flex-col justify-between min-[810px]:block"
    >
      <div className="relative h-[541px] overflow-hidden rounded-[8px] min-[810px]:h-full">
        <div className="absolute inset-0 transition-[transform,filter] duration-300 ease-[cubic-bezier(0.44,0,0.56,1)] min-[810px]:group-hover:scale-110 min-[810px]:group-hover:brightness-50">
          <Image
            src={work.image}
            alt={work.title}
            fill
            priority={priority}
            sizes="(max-width: 809px) 350px, 50vw"
            className="object-cover"
            style={{ objectPosition: work.position }}
          />
        </div>
        <div className="absolute top-1/2 left-0 hidden h-[55px] w-full -translate-y-1/2 items-center px-6 backdrop-blur-[5px] min-[810px]:flex">
          <p className="vs-body shrink-0 text-vs-card-text">{work.client}</p>
          <h4 className="min-w-0 flex-1 text-center font-grotesk text-[24px] leading-[1.3] font-medium tracking-[0.01em] text-vs-card-text">
            {work.title}
          </h4>
          <p className="vs-body shrink-0 text-vs-card-text">{work.category}</p>
        </div>
      </div>
      <div className="min-[810px]:hidden">
        <h5 className="vs-h5 text-vs-fg">{work.title}</h5>
        <p className="font-inter text-[12px] leading-[18px] font-light text-vs-fg">{work.category}</p>
      </div>
    </a>
  );
}
