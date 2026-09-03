import Image from "next/image";

export function WhyChooseBlock() {
  const features = [
    {
      icon: "/images/Asset_390_1.svg",
      title: "Native Sourcing",
      description:
        "Highest quality raw material from native regions all over India.",
    },
    {
      icon: "/images/Asset_391_1.svg",
      title: "Traditional Processing",
      description:
        "Minimally processed using time-tested methods, made better. For maximum nutrition.",
    },
    {
      icon: "/images/Asset_394_1.svg",
      title: "Extensive Quality Checks",
      description:
        "Everything goes through 20+ lab tests, to make sure that you get only what is best.",
    },
    {
      icon: "/images/Asset_395_1.svg",
      title: "Better Rural Lives",
      description:
        "5000+ farmer families are empowered with every product you buy.",
    },
  ];

  return (
    <section className="bg-[#fafcfa] py-8 px-10">
      <div className="text-center flex flex-col items-center justify-center gap-10">
        <h2 className="text-3xl md:text-4xl font-bold text-[#235a45] font-serif tracking-wide">
          Why Choose Divantraa?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-center text-center gap-4"
            >
              {/* Icon wrapper with fixed size */}
              <div className="h-24 w-24 flex items-center justify-center">
                <Image
                  src={f.icon}
                  alt={f.title}
                  width={90}
                  height={90}
                  className="object-contain"
                />
              </div>
              <h3 className="text-lg font-semibold text-[#235a45]">{f.title}</h3>
              <p className="text-sm text-[#666] max-w-xs">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
