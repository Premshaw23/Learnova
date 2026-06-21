"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Tooltip from "@/components/ui/Tooltip";

const DEFAULT_GITHUB_OWNER = "codedbydollys10";
const DEFAULT_GITHUB_REPO = "Learnova";
const GITHUB_OWNER =
  process.env.NEXT_PUBLIC_GITHUB_OWNER || DEFAULT_GITHUB_OWNER;
const GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_REPO || DEFAULT_GITHUB_REPO;
const REQUIRED_LOGIN = GITHUB_OWNER;
const CONTRIBUTORS_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contributors?per_page=100`;
const MANDATORY_USER_URL = `https://api.github.com/users/${REQUIRED_LOGIN}`;

const ContributorsShowcase = () => {
  const [contributors, setContributors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadContributors = async () => {
      try {
        if (!CONTRIBUTORS_URL || !MANDATORY_USER_URL) {
          throw new Error("Missing GitHub configuration");
        }

        const response = await fetch(CONTRIBUTORS_URL, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to fetch contributors");
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Invalid contributors response");
        }

        const uniqueContributors = [];
        const seenLogins = new Set();
        const excludedLogins = new Set([
          "sricharan-213",
          "paripnj",
          "varun29sharma",
          "zairahussian27",
        ]);

        data.forEach((contributor) => {
          const login = contributor?.login?.toLowerCase();
          if (!login || excludedLogins.has(login)) return;

          if (!seenLogins.has(login)) {
            seenLogins.add(login);
            uniqueContributors.push(contributor);
          }
        });

        const hasRequiredContributor = uniqueContributors.some(
          (result) => result.login?.toLowerCase() === REQUIRED_LOGIN
        );

        if (!hasRequiredContributor) {
          const userResponse = await fetch(MANDATORY_USER_URL, {
            signal: controller.signal,
          });

          if (!userResponse.ok) {
            throw new Error("Unable to fetch mandatory contributor");
          }

          const userData = await userResponse.json();
          if (!userData?.login) {
            throw new Error("Invalid mandatory contributor response");
          }

          uniqueContributors.push({
            login: userData.login,
            avatar_url: userData.avatar_url,
            html_url: userData.html_url,
          });
        }

        if (isMounted) {
          setContributors(uniqueContributors);
          setHasError(false);
        }
      } catch (error) {
        if (isMounted) {
          setHasError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadContributors();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  if (hasError) {
    return null;
  }

  const visibleContributors = (() => {
    const slice = contributors.slice(0, 23);
    const requiredContributor = contributors.find(
      (item) => item.login?.toLowerCase() === REQUIRED_LOGIN
    );

    if (!requiredContributor) {
      return slice;
    }

    const desiredIndex = 21; // zero-based index for 22nd position
    const currentIndex = slice.findIndex(
      (item) => item.login?.toLowerCase() === REQUIRED_LOGIN
    );

    if (currentIndex === desiredIndex) {
      return slice;
    }

    const result = [...slice];
    if (currentIndex !== -1) {
      result.splice(currentIndex, 1);
    }

    if (result.length < 23) {
      result.push(requiredContributor);
      return result.slice(0, 23);
    }

    result.splice(desiredIndex, 0, requiredContributor);
    return result.slice(0, 23);
  })();

  const remainingCount =
    contributors.length > visibleContributors.length
      ? contributors.length - visibleContributors.length
      : 0;

  return (
    <section className="bg-card backdrop-blur-xl rounded-3xl p-8 border border-border mt-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center sm:text-left">
          <h2 className="text-3xl font-bold text-foreground">
            ❤️ Built by Contributors
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto sm:mx-0">
            Learnova is proudly built in public by open-source contributors.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center sm:justify-start gap-4">
          {isLoading
            ? Array.from({ length: 23 }).map((_, index) => (
                <div
                  key={index}
                  className="w-16 h-16 rounded-full bg-slate-900/70 border border-border animate-pulse"
                />
              ))
            : visibleContributors.map((contributor) => (
                <Tooltip
                  key={contributor.login}
                  text={contributor.login}
                  position="top"
                >
                  <a
                    href={contributor.html_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`View ${contributor.login} on GitHub`}
                    className="group inline-flex rounded-full overflow-hidden border border-white/10 shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-accent/60"
                  >
                    <Image
                      src={contributor.avatar_url}
                      alt={`Avatar of ${contributor.login}`}
                      width={64}
                      height={64}
                      className="w-16 h-16 object-cover"
                    />
                  </a>
                </Tooltip>
              ))}

          {!isLoading && remainingCount > 0 && (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-white/10 bg-slate-900/70 text-sm font-semibold text-white shadow-lg">
              +{remainingCount}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ContributorsShowcase;
