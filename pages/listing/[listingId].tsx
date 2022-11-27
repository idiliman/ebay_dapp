import { UserCircleIcon } from "@heroicons/react/24/solid";
import {
  useContract,
  useNetwork,
  useNetworkMismatch,
  useMakeBid,
  useMakeOffer,
  useBuyNow,
  MediaRenderer,
  useAddress,
  useListing,
  useOffers,
  useAcceptDirectListingOffer,
  ConnectWallet,
} from "@thirdweb-dev/react";
import { ListingType, NATIVE_TOKENS } from "@thirdweb-dev/sdk";
import { useRouter } from "next/router";
import { env, listeners } from "process";
import { stringify } from "querystring";
import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import Countdown from "react-countdown";
import network from "../../utils/network";
import { ethers } from "ethers";

function ListingPage() {
  const router = useRouter();
  const { listingId } = router.query as { listingId: string };
  const [bidAmount, setBidAmount] = useState("");
  const [, switchNetwork] = useNetwork();
  const networkMismatch = useNetworkMismatch();
  const address = useAddress();

  const [minimumNextBid, setMinimumNextBid] = useState<{
    displayValue: string;
    symbol: string;
  }>();

  const { contract } = useContract(
    process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT,
    "marketplace"
  );

  const { mutate: makeBid } = useMakeBid(contract);

  const { data: offers } = useOffers(contract, listingId);

  const { mutate: makeOffer } = useMakeOffer(contract);

  const { mutate: buyNow } = useBuyNow(contract);

  const { data: listing, isLoading, error } = useListing(contract, listingId);

  const { mutate: acceptOffer } = useAcceptDirectListingOffer(contract);

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

  const buyNft = async () => {
    address === undefined && alert("Please connect your wallet first");

    if (networkMismatch) {
      switchNetwork && switchNetwork(network);
      return;
    }

    if (!listingId || !contract || !listing) return;

    // Can try useQuery instead
    await buyNow(
      {
        id: listingId,
        buyAmount: 1,
        type: listing.type,
      },
      {
        onSuccess(data, variables, context) {
          alert("NFT bought successfully");
          console.log("SUCCESS", data);
          router.replace("/");
        },
        onError(error, variables, context) {
          alert("ERROR: NFT could not be bought");
          console.log("ERROR", error);
        },
      }
    );
  };

  const createBidOrOffer = async () => {
    try {
      if (!address) {
        alert("Please connect wallet first");
        return;
      }

      if (networkMismatch) {
        switchNetwork && switchNetwork(network);
        return;
      }

      // Direct listing
      if (listing?.type === 0) {
        if (
          listing.buyoutPrice.toString() ===
          ethers.utils.parseEther(bidAmount).toString()
        ) {
          console.log("Buyout Price met, buying NFT...");

          buyNft();
          return;
        }
        console.log("Buyout price not met, making offer...");
        await makeOffer(
          {
            listingId,
            quantity: 1,
            pricePerToken: bidAmount,
          },
          {
            onSuccess(data, variables, context) {
              alert("Offer made successfully");
              console.log("SUCCESS", data);
              setBidAmount("");
            },
            onError(error, variables, context) {
              alert("ERROR: Offer could not be made");
              console.log("ERROR", error);
            },
          }
        );
      }

      // Auction listing
      if (listing?.type === 1) {
        console.log("Making Bid...");

        await makeBid(
          {
            listingId,
            bid: bidAmount,
          },
          {
            onSuccess(data, variables, context) {
              alert("Bid made successfully");
              console.log("SUCCESS", data, variables, context);
            },
            onError(error, variables, context) {
              alert("Bid could not be made");
              console.log("SUCCESS", error, variables, context);
            },
          }
        );
      }
    } catch (error) {
      console.error(error);
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

            <button
              onClick={buyNft}
              className="col-start-2 mt-2 bg-blue-500 text-white rounded-full w-44 py-4 px-10"
            >
              Buy Now
            </button>
          </div>

          {/* If Direct listing show offer */}
          {listing.type === 0 && offers && (
            <div className="grid grid-cols-2">
              <p>Offers:</p>
              <p>{offers.length > 0 ? offers.length : 0}</p>

              {offers.map((offer) => (
                <>
                  <p className="flex items-center ml-5 text-sm italic">
                    <UserCircleIcon className="h-3 mr-2" />
                    {offer.offeror.slice(0.5) + "..." + offer.offeror.slice(-5)}
                  </p>

                  <div>
                    <p key={offer.listingId} className="text-sm italic">
                      {ethers.utils.formatEther(offer.totalOfferAmount)}{" "}
                      {NATIVE_TOKENS[network].symbol}
                    </p>

                    {listing.sellerAddress === address && (
                      <button
                        onClick={() =>
                          acceptOffer(
                            {
                              listingId,
                              addressOfOfferor: offer.offeror,
                            },
                            {
                              onSuccess(data, variables, context) {
                                alert("Offer accepted successfully!");
                                console.log(data, variables, context);
                                router.replace("/");
                              },onSettled(data, error, variables, context) {
                                  alert("ERROR: Offer could not be accepted")
                                  console.log(error, variables, context)
                    
                              },
                            }
                          )
                        }
                        className="p-2 w-32 bg-red-500/50 rounded-lg font-bold text-xs cursor-pointer"
                      >
                        Accept Offer
                      </button>
                    )}
                  </div>
                </>
              ))}
            </div>
          )}

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
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder={formatPlaceholder()}
            />
            <button
              onClick={createBidOrOffer}
              className="bg-red-600 text-white font-bold rounded-full w-44 py-4 px-10"
            >
              {listing.type === 0 ? "Offer" : "Bid"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ListingPage;
