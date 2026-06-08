import Image from "next/image";
import contributors from "@/data/contributors.json";

const ContributorsSection = () => {
  return (
    <section
      id="contributors"
      className="py-20 px-4 sm:px-6 lg:px-8 relative"
      aria-labelledby="contributors-heading"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2
            id="contributors-heading"
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Open Source Contributors
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Thank you to everyone helping build Learnova.
          </p>
        </div>

        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
          {contributors.map((contributor) => (
            <li key={contributor.username}>
              <a
                href={`https://github.com/${contributor.username}`}
                target="_blank"
                rel="noreferrer noopener"
                className="group flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-accent/40 hover:bg-white/10 transition-all duration-300"
              >
                <Image
                  src={`https://github.com/${contributor.username}.png?size=120`}
                  alt={`${contributor.name} GitHub avatar`}
                  width={72}
                  height={72}
                  className="w-16 h-16 rounded-full border-2 border-accent/30 group-hover:border-accent transition-colors"
                  unoptimized
                />
                <div className="text-center">
                  <p className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
                    {contributor.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    @{contributor.username}
                  </p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default ContributorsSection;
