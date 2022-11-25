import { useRouter } from "next/router";
import React from "react";

function ListingPage() {
  const router = useRouter();

  return <div>ListingPage {router.query.listing} </div>;
}

export default ListingPage;
