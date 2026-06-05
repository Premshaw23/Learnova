"use client";

import React from "react";
import algoliasearch from "algoliasearch/lite";
import { InstantSearch, SearchBox, Hits, Highlight } from "react-instantsearch";

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;

// Create client only if keys are present to avoid noisy network failures
const searchClient = appId && apiKey ? algoliasearch(appId, apiKey) : null;

function Hit({ hit }) {
  return (
    <article className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow mb-4">
      <h3 className="text-xl font-bold mb-2">
        <Highlight attribute="title" hit={hit} />
      </h3>
      <p className="text-gray-600 dark:text-gray-300">
        <Highlight attribute="description" hit={hit} />
      </p>
    </article>
  );
}

export default function AlgoliaSearch() {
  if (!searchClient) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 text-center text-red-500">
        Search is currently unavailable (missing configuration).
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <InstantSearch searchClient={searchClient} indexName="courses">
        <div className="mb-8">
          <SearchBox
            classNames={{
              root: "w-full",
              input:
                "w-full p-4 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-900",
              submitIcon: "hidden",
              resetIcon: "hidden",
            }}
            placeholder="Search courses..."
          />
        </div>
        <Hits hitComponent={Hit} classNames={{ list: "flex flex-col gap-4" }} />
      </InstantSearch>
    </div>
  );
}
