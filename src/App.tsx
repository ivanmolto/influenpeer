import { useMemo, useCallback, useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import {
  useAsset,
  useUpdateAsset,
  useCreateAsset,
  Player,
} from "@livepeer/react";

import { useDropzone } from "react-dropzone";
import BarLoader from "react-spinners/BarLoader";

import { useAccount, useContractWrite, usePrepareContractWrite } from "wagmi";

import { BsCheck2Circle } from "react-icons/bs";
import { BsTwitter } from "react-icons/bs";
import { FilmIcon } from "@heroicons/react/24/solid";

import { videoNftAbi } from "./components/videoNftAbi";

import soundtrap from "./assets/soundtrap.png";
import fashion from "./assets/fashion.png";
import styling from "./assets/styling.png";
import clothing from "./assets/clothing.png";
import dancing from "./assets/dancing.png";
import influenpeer from "./assets/influenpeer.svg";

export default function Home() {
  const [video, setVideo] = useState<File | null>(null);
  const [assetName, setAssetName] = useState<string>("");
  const [disabled, setDisabled] = useState<boolean>(false);
  const [description, setDescription] = useState<string>();
  const [isWriteInProgress, setIsWriteInProgress] = useState<boolean>();
  const [isUpdateAsset, setIsUpdateAsset] = useState<boolean>();
  const [isFileSelected, setIsFileSelected] = useState<boolean>(false);
  const [isUploadingToIPFS, setIsUploadingToIPFS] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showErrorMessage, setShowErrorMessage] = useState<boolean>(false);
  const [buttonClicked, setButtonClicked] = useState<boolean>(false);

  const { address } = useAccount();

  // Creating an asset
  const {
    mutate: createAsset,
    data: createdAsset,
    status: createStatus,
    progress,
  } = useCreateAsset(
    video ? { sources: [{ name: assetName, file: video }] as const } : null,
  );

  // Drag and Drop file function
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0 && acceptedFiles?.[0]) {
      setVideo(acceptedFiles[0]);
      setIsFileSelected(true);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "video/*": [".mp4"],
    },
    maxFiles: 1,
    onDrop,
  });

  // Getting asset and refreshing status
  const {
    data: asset,
    error,
    status: assetStatus,
  } = useAsset({
    assetId: createdAsset?.[0].id,
    refetchInterval: (asset) =>
      asset?.storage?.status?.phase !== "ready" ? 5000 : false,
  });

  // Storing asset to IPFS with metadata by updating the asset
  const { mutate: updateAsset, status: updateStatus } = useUpdateAsset(
    asset
      ? {
          name: assetName,
          assetId: asset.id,
          storage: {
            ipfs: true,
            metadata: {
              description,
              image: null as any, // clear the default thumbnail
            },
          },
        }
      : undefined,
  );

  // Displaying the progress of uploading and processing the asset
  const progressFormatted = useMemo(
    () =>
      progress?.[0].phase === "failed"
        ? "Failed to process video."
        : progress?.[0].phase === "waiting"
        ? "Waiting"
        : progress?.[0].phase === "uploading"
        ? `Video Uploading: ${Math.round(progress?.[0]?.progress * 100)}%`
        : progress?.[0].phase === "processing"
        ? `Video Processing: ${Math.round(progress?.[0].progress * 100)}%`
        : null,
    [progress],
  );

  const uploading = useMemo(
    () =>
      progress?.[0].phase === "uploading"
        ? "Uploading to the Livepeer network..."
        : null,
    [progress],
  );

  const processing = useMemo(
    () =>
      progress?.[0].phase === "processing"
        ? `Uploading to the Livepeer network ✅ \n Processing to ensure optimal playback...`
        : null,
    [progress],
  );

  const uploadIPFS = useMemo(
    () =>
      progress?.[0].phase === "ready"
        ? `Uploading to the Livepeer network ✅ \n Processing to ensure optimal playback ✅ \n Storing on IPFS...`
        : null,
    [progress],
  );

  // Providing the mint contract information

  const { config } = usePrepareContractWrite({
    // Address of the Influenpeer NFT contract on the OP Superchain (OP Mainnet, Base, and Zora by now)
    address: "0x9FBC9D6cebca4748A9709C75c57d6600f60862D1",
    abi: videoNftAbi,
    // Function on the contract
    functionName: "mint",
    // Arguments for the mint function
    args:
      address && asset?.storage?.ipfs?.nftMetadata?.url
        ? [address, asset?.storage?.ipfs?.nftMetadata?.url]
        : undefined,
    enabled: Boolean(address && asset?.storage?.ipfs?.nftMetadata?.url),
  });

  // Writing to the mint contract

  const {
    data: contractWriteData,
    isSuccess,
    isLoading: isContractWriteLoading,
    write,
    error: contractWriteError,
  } = useContractWrite(config);

  const isLoading = useMemo(
    () =>
      createStatus === "loading" ||
      assetStatus === "loading" ||
      updateStatus === "loading" ||
      (asset && asset?.status?.phase !== "ready") ||
      (asset?.storage && asset?.storage?.status?.phase !== "ready") ||
      isContractWriteLoading,
    [asset, assetStatus, updateStatus, isContractWriteLoading, createStatus],
  );

  // Runs after an asset is created
  useEffect(() => {
    if (!isUpdateAsset && updateAsset && updateStatus === "idle") {
      setIsUploadingToIPFS(true);
      setIsFileSelected(false);
      setIsUpdateAsset(true);
      setIsProcessing(true);
      updateAsset();
    }
  }, [updateAsset, updateStatus, isUpdateAsset]);

  // Runs after an asset is uploaded to IPFS
  useEffect(() => {
    if (
      !isWriteInProgress &&
      asset?.storage?.status?.phase === "ready" &&
      write
    ) {
      setIsWriteInProgress(true);
      write();
    }
  }, [write, asset?.storage?.status?.phase, isWriteInProgress]);

  const twitterLink = `https://twitter.com/intent/tweet?text=Check%20out%20my%20Video%20NFT%20📽️%0D${assetName}%20minted%20on%20%23Influenpeer.%0D%0D🛠️%20Built%20on%20%40Superchain%0D%20🌐%20Powered%20by%20%40Zora%0D%0DCreate%20your%20%23Influenpeer%20here%20👇%20https://www.influenpeer.com`;

  return (
    <div className="bg-white">
      <header className="absolute inset-x-0 top-0 z-50">
        <nav
          className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
          aria-label="Global"
        >
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 p-1.5 flex flex-row">
              <span className="sr-only">Influenpeer</span>
              <img className="h-10 w-auto" src={influenpeer} alt="" />
              <span className="text-indigo-600 ml-1 mt-2 text-2xl hidden h-10 w-auto sm:block">
                influenpeer
              </span>
            </a>
          </div>

          <div className="lg:flex lg:flex-1 lg:justify-end">
            <div className="text-sm font-semibold leading-6 text-gray-900">
              <ConnectButton accountStatus={"address"} />
            </div>
          </div>
        </nav>
      </header>
      <main>
        <div className="relative isolate">
          <svg
            className="absolute inset-x-0 top-0 -z-10 h-[64rem] w-full stroke-gray-200 [mask-image:radial-gradient(32rem_32rem_at_center,white,transparent)]"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="1f932ae7-37de-4c0a-a8b0-a6e3b4d44b84"
                width={200}
                height={200}
                x="50%"
                y={-1}
                patternUnits="userSpaceOnUse"
              >
                <path d="M.5 200V.5H200" fill="none" />
              </pattern>
            </defs>
            <svg x="50%" y={-1} className="overflow-visible fill-gray-50">
              <path
                d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
                strokeWidth={0}
              />
            </svg>
            <rect
              width="100%"
              height="100%"
              strokeWidth={0}
              fill="url(#1f932ae7-37de-4c0a-a8b0-a6e3b4d44b84)"
            />
          </svg>
          <div
            className="absolute left-1/2 right-0 top-0 -z-10 -ml-24 transform-gpu overflow-hidden blur-3xl lg:ml-24 xl:ml-48"
            aria-hidden="true"
          >
            <div
              className="aspect-[801/1036] w-[50.0625rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
              style={{
                clipPath:
                  "polygon(63.1% 29.5%, 100% 17.1%, 76.6% 3%, 48.4% 0%, 44.6% 4.7%, 54.5% 25.3%, 59.8% 49%, 55.2% 57.8%, 44.4% 57.2%, 27.8% 47.9%, 35.1% 81.5%, 0% 97.7%, 39.2% 100%, 35.2% 81.4%, 97.2% 52.8%, 63.1% 29.5%)",
              }}
            />
          </div>
          <div className="overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 pb-32 pt-36 sm:pt-60 lg:px-8 lg:pt-32">
              <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
                <div className="w-full max-w-xl lg:shrink-0 xl:max-w-2xl">
                  {!address && (
                    <h1 className="sm:-mt-28 lg:-mt-72 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
                      We’re changing the way people influence.
                    </h1>
                  )}
                  {address && (
                    <h1 className="sm:mt-16 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
                      We’re changing the way people influence.
                    </h1>
                  )}
                  <p className="relative mt-6 text-lg leading-8 text-gray-600 sm:max-w-md lg:max-w-none">
                    Create a video NFT and engage with your audience. <br />
                    Minting as a new way of communication with your followers.
                  </p>
                  {address ? (
                    <div className="sm:max-w-md lg:max-w-lg">
                      {asset?.status?.phase !== "ready" && (
                        <div
                          className="mt-8 border border-dashed border-blue-600 bg-gray-100 rounded p-5 mb-4 cursor-pointer "
                          {...getRootProps()}
                        >
                          <input {...getInputProps()} />
                          <div className="flex-row">
                            {video ? (
                              <div className="flex justify-center h-48 items-center">
                                <p className="text-base text-green-600 ">
                                  File Selected{" "}
                                </p>
                                <BsCheck2Circle className="text-green-600 text-xl mt-1 ml-4" />
                              </div>
                            ) : (
                              <div className="text-center text-gray-900">
                                <div className="">
                                  <div className="mt-2 flex justify-center rounded-lg bg-gray-100 border-gray-900/25 px-6 py-10">
                                    <div className="text-center">
                                      <FilmIcon
                                        className="mx-auto h-12 w-12 text-gray-300"
                                        aria-hidden="true"
                                      />
                                      <div className="mt-4 flex text-sm leading-6 text-gray-600">
                                        <label
                                          htmlFor="file-upload"
                                          className="relative cursor-pointer rounded-md font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                                        >
                                          <span>Upload</span>
                                          <input
                                            id="file-upload"
                                            name="file-upload"
                                            type="file"
                                            className="sr-only"
                                          />
                                        </label>
                                        <div className="pl-1">
                                          or drag and drop
                                        </div>
                                      </div>
                                      <div className="text-sm leading-5 text-gray-600">
                                        a video file up to 10GB
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Displays the player with NFT information */}
                      {asset?.storage?.ipfs?.cid ? (
                        <div>
                          <div className="flex flex-col justify-center items-center ml-5">
                            <p className="mt-4 text-sm text-gray-900">
                              Your video is now ready to be minted! Complete
                              minting process in your wallet.
                            </p>
                            <div className="border border-solid border-indigo-600 rounded-md p-6 mb-4 mt-5 lg:w-3/4 w-100">
                              <Player playbackId={asset?.storage?.ipfs?.cid} />
                            </div>
                            <div className="items-center w-3/4">
                              {contractWriteData?.hash && isSuccess ? (
                                <div className="flex"></div>
                              ) : contractWriteError ? (
                                <div>
                                  <button
                                    className="border border-transparent hover:text-indigo-600 rounded-lg px-5 py-3 bg-slate-800 mr-5 hover:border-blue-600"
                                    onClick={() =>
                                      setShowErrorMessage(!showErrorMessage)
                                    }
                                  >
                                    {showErrorMessage ? (
                                      <span>Hide Error</span>
                                    ) : (
                                      <span>Show Error</span>
                                    )}
                                  </button>
                                  <a href={`/`} rel="noreferrer">
                                    <button className="border border-transparent hover:text-blue-600 rounded-lg px-5 py-3 bg-slate-800 mr-5 hover:border-indigo-600">
                                      Return to Form
                                    </button>
                                  </a>
                                  {showErrorMessage && (
                                    <div className="border border-solid border-blue-600 rounded-md p-6 mb-4 mt-5 overflow-x-auto">
                                      <p className="text-center text-red-600">
                                        {contractWriteError.message}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <></>
                              )}
                            </div>
                            {/* Card with NFT Information */}
                            <div className="border border-solid border-blue-600 rounded-md p-6 mb-4 mt-5 lg:w-3/4 w-96">
                              <div className="grid grid-row-2">
                                <h1 className="text-5xl place-self-start">
                                  {assetName}
                                </h1>
                                <a
                                  href={twitterLink}
                                  className="place-self-end"
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <button className="bg-sky-500 hover:bg-slate-200 rounded-md pr-4 p-2 mb-1 hover:text-indigo-500">
                                    <span className="flex">
                                      <BsTwitter className="text-xl mt-0.5 " />
                                      <p className="text-xl  ml-1">Share</p>
                                    </span>{" "}
                                  </button>
                                </a>
                              </div>
                              <div className="border-b-2 border-zinc-600"></div>
                              <div className="mt-2">
                                <p className="text-start text-xl">
                                  {description}
                                </p>
                              </div>
                              <p className="text-center text-white hover:text-blue-600 mt-10 break-words">
                                <div className="border-b-2 border-zinc-600 mb-4"></div>
                                Gateway URL:
                                <br />
                                <a href={asset?.storage?.ipfs?.gatewayUrl}>
                                  {asset?.storage?.ipfs?.gatewayUrl}
                                </a>
                              </p>
                              {isSuccess && (
                                <a
                                  target="_blank"
                                  href={`https://explorer.testnet.mantle.xyz/tx/${contractWriteData?.hash}`}
                                  rel="noreferrer"
                                >
                                  <button className=" mt-6 rounded px-5 py-2 hover:bg-slate-800 mr-5 bg-zinc-700">
                                    View Transaction
                                  </button>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="text-center my-5 text-blue-600">
                            {video && (
                              <p className="text-sm text-gray-900 whitespace-pre-line">
                                {uploading}
                                {processing}
                                {uploadIPFS}
                              </p>
                            )}
                          </div>
                          {/* Form for NFT creation */}
                          <div className="flex flex-col ">
                            <label htmlFor="asset-name" className="text-left">
                              <span className="text-sm text-gray-900">
                                Name:
                              </span>{" "}
                              <span className="text-red-600">*</span>
                            </label>
                            <input
                              className="rounded bg-gray-100 p-1 text-sm text-gray-900"
                              type="text"
                              value={assetName}
                              name="asset-name"
                              required
                              placeholder="Type the name of your NFT here"
                              disabled={disabled}
                              onChange={(e) => setAssetName(e.target.value)}
                            />
                            <br />
                            <label htmlFor="description" className="text-left">
                              <span className="text-sm text-gray-900">
                                Description:
                              </span>{" "}
                              <span className="text-red-600">*</span>
                            </label>
                            <textarea
                              className="rounded bg-gray-100 mb-5 p-1 text-sm text-gray-900"
                              value={description}
                              name="description"
                              required
                              placeholder="Type a description of your NFT here"
                              disabled={disabled}
                              onChange={(e) => setDescription(e.target.value)}
                            />
                            {/* Upload Asset */}
                            <div className="flex justify-start">
                              {asset?.status?.phase !== "ready" ||
                              asset?.storage?.status?.phase !== "ready" ? (
                                <div>
                                  {!description ? (
                                    <button className="rounded-md p-3 bg-slate-800 px-3.5 py-2.5 text-sm font-semibold opacity-50 cursor-not-allowed">
                                      Create NFT
                                    </button>
                                  ) : (
                                    <button
                                      className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                      onClick={() => {
                                        if (video) {
                                          setDisabled(true),
                                            setButtonClicked(true),
                                            createAsset?.();
                                        }
                                      }}
                                    >
                                      Create NFT
                                      <br />
                                      {isLoading && <BarLoader color="#fff" />}
                                    </button>
                                  )}
                                  <p className="mt-4 text-sm text-gray-900">
                                    When your wallet interface appears, your
                                    video is ready to be minted!
                                  </p>
                                </div>
                              ) : (
                                <></>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <p></p>
                  )}
                </div>
                {!address && (
                  <div className="mt-14 flex justify-end gap-8 md:-mt-28 md:justify-start sm:pl-20 lg:mt-0 lg:pl-0">
                    <div className="ml-auto w-44 flex-none space-y-8 pt-32 sm:ml-0 sm:pt-80 lg:order-last lg:pt-36 xl:order-none xl:pt-80">
                      <div className="relative">
                        <img
                          src={soundtrap}
                          alt=""
                          className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                        />
                        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                      </div>
                    </div>
                    <div className="mr-auto w-44 flex-none space-y-8 sm:mr-0 sm:pt-52 lg:pt-36">
                      <div className="relative">
                        <img
                          src={fashion}
                          alt=""
                          className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                        />
                        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                      </div>
                      <div className="relative">
                        <img
                          src={dancing}
                          alt=""
                          className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                        />
                        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                      </div>
                    </div>
                    <div className="w-44 flex-none space-y-8 pt-32 sm:pt-0">
                      <div className="relative">
                        <img
                          src={styling}
                          alt=""
                          className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                        />
                        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                      </div>
                      <div className="relative">
                        <img
                          src={clothing}
                          alt=""
                          className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                        />
                        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                      </div>
                    </div>
                  </div>
                )}
                {address && (
                  <div className="mt-14 flex justify-end gap-8 md:-mt-28 md:justify-start sm:pl-20 lg:-mt-24 lg:pl-0">
                    <div className="ml-auto w-44 flex-none space-y-8 pt-32 sm:ml-0 sm:pt-80 lg:order-last lg:pt-36 xl:order-none xl:pt-80">
                      <div className="relative">
                        <img
                          src={soundtrap}
                          alt=""
                          className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                        />
                        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                      </div>
                    </div>
                    <div className="mr-auto w-44 flex-none space-y-8 sm:mr-0 sm:pt-52 lg:pt-36">
                      <div className="relative">
                        <img
                          src={fashion}
                          alt=""
                          className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                        />
                        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                      </div>
                      <div className="relative">
                        <img
                          src={dancing}
                          alt=""
                          className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                        />
                        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                      </div>
                    </div>
                    <div className="w-44 flex-none space-y-8 pt-32 sm:pt-0">
                      <div className="relative">
                        <img
                          src={styling}
                          alt=""
                          className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                        />
                        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                      </div>
                      <div className="relative">
                        <img
                          src={clothing}
                          alt=""
                          className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                        />
                        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
