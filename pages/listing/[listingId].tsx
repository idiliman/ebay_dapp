import { UserCircleIcon } from "@heroicons/react/24/solid";
import { MediaRenderer, useContract, useListing } from "@thirdweb-dev/react";
import { ListingType } from "@thirdweb-dev/sdk";
import { useRouter } from "next/router";
import { listeners } from "process";
import { stringify } from "querystring";
import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import Countdown from "react-countdown";

function ListingPage() {
  const router = useRouter();
  const { listingId } = router.query as { listingId: string };
  const [minimumNextBid, setMinimumNextBid] = useState<{
    displayValue: string;
    symbol: string;
  }>();

  const { contract } = useContract(
    process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT,
    "marketplace"
  );

  const { data: listing, isLoading, error } = useListing(contract, listingId);

  useEffect(() => {
    if (!listingId || !contract || !listing) return;

    if (listing.type === ListingType.Auction) {
      fetchMinNextBid();
    }
  }, [listingId, listing, contract]);

  console.log(minimumNextBid);

  const fetchMinNextBid = async () => {
    if (!listingId || !contract) return;

    const { displayValue, symbol } = await contract.auction.getMinimumNextBid(
      listingId
    );

    setMinimumNextBid({
      displayValue: displayValue,
      symbol: symbol,
    });
  };

  // Listing type 0: Direct 1: Auction
  const formatPlaceholder = () => {
    if (!listing) return;

    if (listing.type === 0) {
      return "Enter Offer Amount";
    } else if (listing.type === 1) {
      return Number(minimumNextBid?.displayValue) === 0
        ? "Enter Bid Amount"
        : `${minimumNextBid?.displayValue} ${minimumNextBid?.symbol} or more`;
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header />
        <div className="text-center animate-pulse text-blue-500">
          <p>Loading Item...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return <div>Error 404</div>;
  }

  console.log(ListingType, ":)");

  return (
    <div>
      <Header />

      <main className="max-w-6xl mx-auto p-10 flex flex-col lg:flex-row space-y-10 space-x-5 items-center">
        <div className="p-10 border mx-auto lg:mx-0 max-w-md lg:max-w-xl">
          <MediaRenderer src={listing?.asset.image} />
        </div>

        <section className="flex-1 space-y-5 pb-20 lg:pb-0">
          <div className="space-y-2">
            <h1>{listing.asset.name}</h1>
            <p>{listing.asset.description}</p>
            <p className="flex items-center text-sm">
              <UserCircleIcon className="h-6" />
              <span className="font-bold pr-1">Seller:</span>
              {listing.sellerAddress}
            </p>
          </div>

          {/* Listing type */}
          <div className="grid grid-cols-2 items-center py-2">
            <p className="font-bold">Listing Type:</p>
            <p>{listing.type === 0 ? "Direct" : "Auction"}</p>

            <p className="font-bold mb-9">Buy it Now Price:</p>
            <p className="text-4xl font-bold">
              {listing.buyoutCurrencyValuePerToken.displayValue} <br />
              {listing.buyoutCurrencyValuePerToken.symbol}
            </p>

            <button className="col-start-2 mt-2 bg-blue-500 text-white rounded-full w-44 py-4 px-10">
              Buy Now
            </button>
          </div>

          {/* If Direct listing show offer */}
          <div className="grid grid-cols-2 space-y-2 items-center justify-end">
            <hr className="col-span-2 mb-5" />

            <p className="col-span-2 font-bold">
              {listing.type === 0 ? "Make an Offer" : "Bid on this Auction"}
            </p>

            {/* Auction remaining time */}
            {listing.type === 1 && (
              <>
                <p>Current Minimum Bid:</p>
                <p>
                  {minimumNextBid?.displayValue} {minimumNextBid?.symbol}
                </p>

                <p>Time Remaining:</p>
                <Countdown
                  date={Number(listing.endTimeInEpochSeconds.toString()) * 1000}
                />
              </>
            )}
            <input
              className="border p-2 rounded-lg mr-5 outline-none"
              type="text"
              placeholder={formatPlaceholder()}
            />
            <button className="bg-red-600 text-white font-bold rounded-full w-44 py-4 px-10">
              {listing.type === 0 ? "Offer" : "Bid"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ListingPage;
