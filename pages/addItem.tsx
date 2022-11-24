import React, { FormEvent, useState } from "react";
import Header from "../components/Header";
import { useAddress, useContract } from "@thirdweb-dev/react";
import { TicketIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
type Props = {};

export default function addItem({}: Props) {
  const address = useAddress();
  const router = useRouter();
  const [preview, setPreview] = useState<string>();
  const [image, setImage] = useState<File>();

  const { contract } = useContract(
    process.env.NEXT_PUBLIC_COLLECTION_CONTRACT,
    "nft-collection"
  );

  const mintNft = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    //
    if (!contract || !address) return;
    if (!image) {
      alert("Please select an image.");
    }

    //
    const target = e.target as typeof e.target & {
      name: { value: string };
      description: { value: string };
    };

    const metadata = {
      name: target.name.value,
      description: target.description.value,
      image: image,
    };

    try {
      const tx = await contract.mintTo(address, metadata);
      const receipt = tx.receipt; // transaction receipt
      const tokenId = tx.id; // id of the minted NFT
      const nft = await tx.data(); // fecth details of the minted NFT

      console.log(receipt, tokenId, nft);
      router.push("/");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <Header />
      <main className="max-w-6xl mx-auto p-10 border">
        <h1 className="text-4xl font-bold">Add an Item to the Marketplace</h1>
        <h2 className="text-xl font-semibold pt-5">Item Details</h2>
        <p className="pb-10">Mint your item and sell them at the marketplace</p>

        <div className="flex flex-col items-center justify-center md:flex-row md:space-x-10">
          <div className="border h-100 w-80 object-contain ">
            {preview ? <img src={preview} /> : <TicketIcon />}
          </div>

          <form
            onSubmit={mintNft}
            className="flex flex-col flex-1 p-2 space-y-4"
          >
            <label className="font-light">Name of Item</label>
            <input
              className="formField"
              type="text"
              placeholder="Name of item..."
              name="name"
              id="name"
            />

            <label className="font-light">Description</label>
            <input
              className="formField"
              type="text"
              placeholder="Enter Description..."
              name="description"
              id="description"
            />

            <label className="font-light">Image of the Item</label>
            <input
              type="file"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setPreview(URL.createObjectURL(e.target.files[0]));
                  setImage(e.target.files[0]);
                }
              }}
            />

            <button
              type="submit"
              className="bg-blue-600 font-bold text-white rounded-full w-56 py-4 px-10 mx-auto md:mx-0"
            >
              Add/Mint Item
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
