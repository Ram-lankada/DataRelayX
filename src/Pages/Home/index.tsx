import { WsProvider, ApiPromise } from '@polkadot/api';

import { web3Accounts, web3Enable } from '@polkadot/extension-dapp';
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

// React hooks 
import { ChangeEvent, useEffect, useState } from 'react';
import * as CryptoJS from 'crypto-js';
import Cookies from 'js-cookie';
import BN from 'bn.js';

import profile from '../../static/profile.png';
import logo from '../../static/logo.png';
import bigLogo from '../../static/bigLogo.png';
import drone from '../../static/drone.png';
import flight from '../../static/flight.png';
import jet from '../../static/jet.png';
import download from '../../static/download.png';
import view from '../../static/view.png';
import gradient from '../../static/gradient.png';

import Map from '../../Components/map.jsx';
import TextBox1 from '../../Components/Textbox/tb1.tsx';

// import { Cookie } from 'js-cookie';
// import TextBox2 from '../../Components/Textbox/tb2.tsx';
// import ReactDOM from 'react-dom';
// import * as nacl from 'tweetnacl';
// import { Buffer } from 'buffer';
// import 'flowbite';
// import './index.css';
// import { randomBytes } from "crypto"; // Import for random string generation
// import { random as seededRandom } from 'seedrandom';
// declare module 'seedrandom';

type Period = "MORNING" | "NIGHT" | "MIDONE" | "MIDTWO";
const AMOUNT = new BN(10).mul(new BN(10).pow(new BN(12)));
const length = 10;


const NAME = "DataRelayX";
interface Location {
  latitude: number;
  longitude: number;
}

interface AdditionalInfo {
  temperature: number;
  humidity: number;
}

interface DecodedMetaData {
  transactionId: string;
  droneId: string;
  transactionType: string;
  dataCategory: string;
  dataFormat: string;
  dataSize: string;
  sender: string;
  receiver: string;
  location: Location;
  additionalInfo: AdditionalInfo;
}

const App = () => {

  const [api, setApi] = useState<ApiPromise>();
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<InjectedAccountWithMeta>();
  const [dataList, setDataList] = useState<DecodedMetaData[]>([]);
  const [period, setPeriod] = useState<Period>();
  const [selectedDataIndex, setSelectedDataIndex] = useState<number | null>(null); 
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isOpen, setOpen] = useState(false);

  // const [vehicle, setVehicle] = useState<number>('0');
  // const [balance, setBalance] = useState<BN>();
  // var vehicle = 0;

  // let vehicleImageSrc: string | undefined;
  // if (vehicle === 0) {
  //   vehicleImageSrc = drone;
  // } else if (vehicle === 2) {
  //   vehicleImageSrc = flight;
  // } else if (vehicle === 1) {
  //   vehicleImageSrc = jet;
  // }


  const handleDropDown = () => {
    setOpen(!isOpen);
  };

  function handleDataClick(index: number): void {
    setSelectedDataIndex(index);

  }

  // sync call
  // async - await call


  const setup = async () => {
    const wsProvider = new WsProvider("wss://ws.gm.bldnodes.org/");
    const api = await ApiPromise.create({ provider: wsProvider });
    setApi(api);
  };

  // 5 - async 
  // sync - async 

  // Handling wallet authentication
  const handleConnect = async () => {
    const extensions = await web3Enable(NAME);

    if (!extensions) throw Error(' NO_EXTENSIONS_FOUND ');

    const allAccounts = await web3Accounts();
    console.log('allAccounts : ', allAccounts);

    setAccounts(allAccounts);

    if (allAccounts.length === 1) {
      setSelectedAccount(allAccounts[0]);
    }

  };

  const handleAccountSelection = async (e: ChangeEvent<HTMLSelectElement>) => {

    const selectedAddress = e.target.value;

    const account = accounts.find(account => account.address === selectedAddress);

    if (!account)
      throw Error("ACCOUNT_NOT_FOUND");

    setSelectedAccount(account);

    Cookies.set("wallet", JSON.stringify(account));

  }


  // Searching logic 
  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const filteredDataList: DecodedMetaData[] = searchQuery
    ? dataList.filter((data) => data.droneId.toLowerCase().includes(searchQuery.toLowerCase()))
    : dataList;


// Decoding metadata 
  const decodeId = (seed: string): number => {
    const seedChars = seed.split("");
    const a = 1103515245;
    const c = 12345;
    const m = 2147483647;

    // Generate a random starting index for the substring (0 to 31 inclusive)
    const startIndex = Math.floor(Math.random() * seed.length);

    // Extract a random substring of length 10 
    const randomSubstring = seedChars.slice(startIndex, startIndex + 10).join("");

    // Convert the substring to its ASCII code and XOR it with the original state
    let state = seedChars.reduce((acc, char) => acc ^ char.charCodeAt(0), 0);
    state ^= randomSubstring.charCodeAt(0); // XOR with first char of substring

    // Loop for better randomness
    for (let i = 0; i < 10; i++) {
      state = (a * state + c) % m;
    }

    // Return a random number between 0 (inclusive) and 1 (exclusive)
    const id = state / m;
    // console.log("Generating:", id);
    return id;
  };

  const generateHashedId = (input: string): string => {
    const hashedId = CryptoJS.SHA256(input).toString(CryptoJS.enc.Hex);
    return hashedId;
  };

  function padMetaData(parsedMetaData: string): string {
    // Check if parsedMetaData is longer than 32 characters
    // if (parsedMetaData.length > 32) {
    //   throw new Error("Parsed metadata cannot be longer than 32 characters");
    // }

    // Generate random padding characters (excluding numbers)
    const paddingLength = 32 - parsedMetaData.length;
    const allowedChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-"; // Characters excluding numbers

    let paddingChars = "";
    for (let i = 0; i < paddingLength; i++) {
      paddingChars += allowedChars.charAt(Math.floor(Math.random() * allowedChars.length));
    }

    // Pad the parsed metadata with the random characters
    const paddedMetaData = parsedMetaData + paddingChars;

    return paddedMetaData;
  }


  const decodeTransactionId = (parsedMetaData: string): string => {
    const seed = parsedMetaData.substring(0, 7);
    const randomNumber = decodeId(seed);
    const hashedId = generateHashedId(`${randomNumber}${seed}`);
    return `${hashedId}`;
  };

  const decodeDroneId = (parsedMetaData: string): string => {
    const seed = parsedMetaData.substring(7, 15);
    const randomNumber = decodeId(seed);
    const hashedId = generateHashedId(`${randomNumber}${seed}`);
    return `DRN${hashedId}`;
  };

  const decodeSender = (parsedMetaData: string): string => {
    const seed = parsedMetaData.substring(7, 15);
    const randomNumber = decodeId(seed);
    const hashedId = generateHashedId(`${randomNumber}${seed}`);
    return `DRN${hashedId}`;
  };

  const decodeReceiver = (parsedMetaData: string): string => {
    const seed = parsedMetaData.substring(15 - 23);
    const randomNumber = decodeId(seed);
    const hashedId = generateHashedId(`${randomNumber}${seed}`);
    return `DRN${hashedId}`;
  };

  const decodeDataCategory = (parsedMetaData: string): string => {
    const catValue = Number(parsedMetaData.charCodeAt(24));
    if (catValue % 2 === 0)
      return "SNSR"
    else if (catValue % 3 === 0)
      return "IMGE";
    else
      return "AUDI";
  };

  const decodeDataFormat = (parsedMetaData: string): string => {
    const format = Number(parsedMetaData.charCodeAt(25));
    if (format % 2 === 0)
      return "JPEG"
    else if (format % 3 === 0)
      return "AVIF";
    else
      return "PNNG";
  };

  const decodeDataSize = (parsedMetaData: string): string => {
    // const size = parseInt(parsedMetaData.charAt(26), 16) * 100 + 100;
    const size = Number(Number(parsedMetaData.charCodeAt(26)) / 13) * 100;
    return `${size.toFixed(2)} KB`;
  };


  const decodeLocation = (parsedMetaData: string): Location => {

    // const latitude =  parseFloat(parsedMetaData.charAt(27));
    // const longitude = parseFloat(parsedMetaData.charAt(28));

    const latitude = Math.random() * parsedMetaData.charCodeAt(27);
    const longitude = Math.random() * parsedMetaData.charCodeAt(28);

    const details = {
      latitude: parseFloat(latitude.toFixed(4)),
      longitude: parseFloat(longitude.toFixed(4)),
    };
    return details;
  };

  const decodeTransactionType = (parsedMetaData: string): string => {
    const txType = Number(parsedMetaData.charCodeAt(29));
    if (txType % 2 === 0)
      return "DTTX"
    else if (txType % 3 === 0)
      return "CMD";
    else
      return "DTRX";
  };


  const decodeAdditionalInfo = (parsedMetaData: string): AdditionalInfo => {
    const temperature = Math.random() * parsedMetaData.charCodeAt(30);
    const humidity = Math.random() * parsedMetaData.charCodeAt(31);

    const details = {
      temperature: parseFloat(temperature.toFixed(2)),
      humidity: parseFloat(humidity.toFixed(2)),
    };

    return details;
  };

  // 24-1003945597
  const decodeMetaData = (parsedMetaData: string, timestamp: number): DecodedMetaData => {
    const MetaData = padMetaData(parsedMetaData);

    const key = new Uint32Array([0x18, 0xF3, 0x7A, 0x2E, 0x5B, 0x91, 0xE4, 0x6C, 0x33, 0x80, 0x09, 0xD7, 0x56, 0xC8, 0xA5, 0x4F]);
    let nonce = new Uint8Array(12);
    nonce = crypto.getRandomValues(nonce);


    const startTime = performance.now();

    const DecryptedMetaData = decryptWithChaCha20(MetaData, key, nonce);
    console.log("plaintext:", MetaData);
    console.log("Decrypted plaintext:", DecryptedMetaData);

    const endTime = performance.now();
    console.log(`Call to decryptWithChaCha20 took ${endTime - startTime} milliseconds`);


    const decodedData = {
      timestamp: (timestamp + 1),
      transactionId: decodeTransactionId(DecryptedMetaData),
      droneId: decodeDroneId(DecryptedMetaData),
      transactionType: decodeTransactionType(DecryptedMetaData),
      dataCategory: decodeDataCategory(DecryptedMetaData),
      dataFormat: decodeDataFormat(DecryptedMetaData),
      dataSize: decodeDataSize(DecryptedMetaData),
      sender: decodeSender(DecryptedMetaData),
      receiver: decodeReceiver(DecryptedMetaData),
      location: decodeLocation(DecryptedMetaData),
      additionalInfo: decodeAdditionalInfo(DecryptedMetaData),
    };

    return decodedData;
  };

  // Minimal ChaCha20-Poly1305 Decryption algorithm
  const decryptWithChaCha20 = (
    parsedMetaData: string,
    key: Uint32Array,
    nonce: Uint8Array
  ): string => {


    // Define the quarter round function
    const quarterRound = (x: Uint32Array, a: number, b: number, c: number, d: number): void => {
      x[a] = addMod32(x[a], x[b]);
      x[d] = rotateLeft(x[d] ^ x[a], 16);
      x[c] = addMod32(x[c], x[d]);
      x[b] = rotateLeft(x[b] ^ x[c], 12);
      x[a] = addMod32(x[a], x[b]);
      x[d] = rotateLeft(x[d] ^ x[a], 8);
      x[c] = addMod32(x[c], x[d]);
      x[b] = rotateLeft(x[b] ^ x[c], 7);
    };

    // Define utility functions
    const addMod32 = (a: number, b: number): number => {
      return (a + b) >>> 0;
    };

    const rotateLeft = (x: number, n: number): number => {
      return ((x << n) | (x >>> (32 - n))) >>> 0;
    };

    // Initialize the counter
    let counter = 0;
    let combinedData = '';
    let result = '';

    // Perform 20 rounds of bit operations
    for (let round = 0; round < 20; round++) {

      // Clone the key array for each round
      const keyClone = key.slice();

      // Apply quarter round function to each column
      quarterRound(keyClone, 0, 4, 8, 12);
      quarterRound(keyClone, 1, 5, 9, 13);
      quarterRound(keyClone, 2, 6, 10, 14);
      quarterRound(keyClone, 3, 7, 11, 15);
      quarterRound(keyClone, 0, 5, 10, 15);
      quarterRound(keyClone, 1, 6, 11, 12);
      quarterRound(keyClone, 2, 7, 8, 13);
      quarterRound(keyClone, 3, 4, 9, 14);


      // Combine the key, nonce, and counter
      combinedData = keyClone.join('') + nonce.join('') + counter.toString();

      // Apply some bitwise operations on the combined data
      // (Replace this with actual bitwise operations as per the ChaCha20 algorithm)
      result = combinedData
        .split('')
        .map((char, index) => char.charCodeAt(0) ^ index)
        .join('');

      // Update the counter
      counter++;

      // XOR the result with the ciphertext
    }
    parsedMetaData = xorStrings(parsedMetaData, result);

    // Return the plaintext
    return parsedMetaData;
  };

  // Function to perform XOR operation on two strings
  const xorStrings = (str1: string, str2: string): string => {
    let result = '';
    for (let i = 0; i < str1.length; i++) {
      const charCode1 = str1.charCodeAt(i);
      const charCode2 = str2.charCodeAt(i % str2.length);
      const xorResult = charCode1 ^ charCode2;
      result += String.fromCharCode(xorResult);
    }
    return result;
  };


  useEffect(() => {
    setup();
    // Run the js / components code after first html render
  }, []);

  useEffect(() => {
    if (!api)
      return;

    (async () => {

      // for (let i = 0; i < length; i++) {

      setTimeout(async () => {

        const timestamp = (await api.query.timestamp.now()).toPrimitive();
        const metaData = (await api.query.currencies.currentTimePeriod()).toPrimitive() as string;
        let parsedMetaData = metaData.toUpperCase() as Period;

        // setPeriod(parsedMetaData);
        // console.log("parsedMetaData : ", parsedMetaData);
        // const secretKey = generateSecretKey();
        // const nonce = generateNonce();
        // parsedMetaData = decryptFromString(parsedMetaData, secretKey, nonce);

        const decodedData = decodeMetaData(parsedMetaData, Number(timestamp));
        setDataList((prevDataList) => [...prevDataList, decodedData]);
        // setDataList([decodedData]);
      }, 3000);

      // }

    })();

  });

  // let location: Number[] = [
  //   72.943, 24.2621
  // ]


  const handleDownloadClick = () => {
    if (selectedDataIndex !== null) {
      const selectedData = dataList[selectedDataIndex];
      const jsonData = JSON.stringify(selectedData, null, 2);

      // Create a Blob and trigger download
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `Drone_data_${selectedDataIndex}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  // useEffect(() => {

  //   if (!api || !selectedAccount)
  //     return;

  //   // Subcription to RPC query 
  //   api.query.system.account(selectedAccount.address,
  //     ({ data: { free } }: { data: { free: BN } }) => {
  //       setBalance(free);
  //     }
  //   );
  // }, [api, selectedAccount])

  // console.log("cookieAccount : ", cookieAccount);
let cookieAccount = Cookies.get('wallet');
let cookieObject: { meta?: { name: string }, address?: string } | null = null;

if (cookieAccount !== undefined)
  cookieObject = JSON.parse(decodeURIComponent(cookieAccount));


  // console.log("cookieObject : ", cookieObject);

  return (
    <div className='w-[100vw]' >
      <nav className="bg-black border-gray-200 dark:bg-gray-900 sticky">
        <div className="w-full flex flex-wrap items-center justify-between p-4">
          <a href="#" className="flex items-center space-x-4 rtl:space-x-reverse">
            <img src={logo} className="h-10" alt="Data relay X Logo" />
            <span className="self-center font-semibold whitespace-nowrap text-white text-lg dark:text-white"> Data Relay X</span>
          </a>
          <div className="flex items-center md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">

            {/* <button id="dropdownDefaultButton" data-dropdown-toggle="dropdown" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" type="button">Dropdown button
            <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4" />
            </svg>
          </button>

          <div id="dropdown" className="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700">
            <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownDefaultButton">
              <li>
                <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Dashboard</a>
              </li>

            </ul>
          </div> */}

            {
              accounts.length == 0 && cookieObject == undefined ? <div className='' >
                <button
                  onClick={handleConnect}
                  id="dropdownDefaultButton"
                  type="button"
                  className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                  Connect Wallet
                  <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                  </svg>
                </button>
              </div>
                :
                null
            }

            {
              accounts.length > 0 && (cookieObject == undefined) ?
                (
                  <div className='z-10 bg-white divide-y divide-gray-100 rounded-lg shadow  dark:bg-gray-700'>
                    <select className='py-2 text-sm text-gray-700 dark:text-gray-200 w-44 rounded-lg ' onChange={handleAccountSelection} >
                      <option className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white" value="" disabled selected hidden > Choose your account </option>
                      {accounts.map((account) => (
                        <option className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white " value={account.address} > {account.meta.name} : {account.address} </option>
                      ))}
                    </select>
                  </div>
                ) : null
            }

            {selectedAccount || cookieObject != undefined ?
              <div className="dropdown" >
                <button
                  onClick={handleDropDown}
                  type="button"
                  className="flex text-sm bg-gray-800 rounded-full md:me-0 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
                >
                  <img className="w-8 h-8 rounded-full" src={profile} alt="user photo" />
                </button>
              </div> : null
            }



            {/* Connect button testing */}
            {/* {
            accounts.length > 0  ?

              <div className="relative inline-block text-left">
                <button onClick={handleConnect} id="dropdownDefaultButton" type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                  Connect Wallet
                  <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                  </svg>
                </button>

                <div className="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700" id="dropdown">
                  <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownDefaultButton">
                    <option value="" disabled hidden>Select your account</option>
                    {accounts.map((account) => (
                      <li key={account.address}>
                        <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white" onClick={() => handleAccountSelection}>
                          {account.meta.name} : {account.address}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              :
              <div>
                <button type="button" className="flex text-sm bg-gray-800 rounded-full md:me-0 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600" id="user-menu-button" aria-expanded="false" data-dropdown-toggle="user-dropdown" data-dropdown-placement="bottom">
                  <span className="sr-only">Open user menu</span>
                  <img className="w-8 h-8 rounded-full" src={profile} alt="user photo" />
                </button>
                <div className="z-50 hidden my-4 text-base list-none bg-black divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700 dark:divide-gray-600" id="user-dropdown">
                  <div className="px-4 py-3">
                    <span className="block text-sm text-white dark:text-white">Ram ganesh lankada</span>
                    <span className="block text-sm text-white truncate dark:text-gray-400 ">5F4S6xKBBQFUGjKVhNZ7pVMcnz35gbmb41WJ9TUhxUJtkqiR </span>
                  </div>
                  <ul className="py-2" aria-labelledby="user-menu-button">
                    <li>
                      <a href="#" className="block px-4 py-2 text-sm text-white hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Dashboard</a>
                    </li>
                    <li>
                      <a href="#" className="block px-4 py-2 text-sm text-white hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Settings</a>
                    </li>
                    <li>
                      <a href="#" className="block px-4 py-2 text-sm text-white hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Earnings</a>
                    </li>
                    <li>
                      <a href="#" className="block px-4 py-2 text-sm text-white hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Sign out</a>
                    </li>
                  </ul>
                </div>

              </div>
          } */}

            <button data-collapse-toggle="navbar-user" type="button" className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" aria-controls="navbar-user" aria-expanded="false">
              <span className="sr-only">Open main menu</span>
              <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 1h15M1 7h15M1 13h15" />
              </svg>
            </button>
          </div>
          {cookieObject && (
            <div className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1" id="navbar-user">
              <ul className="flex flex-col font-medium p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-black dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
                <li>
                  <a href="#" className="block py-2 px-3 text-white bg-blue-700 rounded md:bg-transparent md:text-blue-700 md:p-0 md:dark:text-blue-500" aria-current="page">Reconnaissance</a>
                </li>
                <li>
                  <a href="#" className="block py-2 px-3 text-white rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"> Analytics</a>
                </li>
                {/* <li>
                <a href="#" className="block py-2 px-3 text-white rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700">Services</a>
              </li>
              <li>
                <a href="#" className="block py-2 px-3 text-white rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700">Pricing</a>
              </li>
              <li>
                <a href="#" className="block py-2 px-3 text-white rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700">Contact</a>
              </li> */}
              </ul>
            </div>
          )}
        </div>
      </nav>

      {/* <div>
        {
          accounts.length === 0 ? <div className='' >
            <button onClick={handleConnect} id="dropdownDefaultButton" type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
              Connect Wallet
              <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
              </svg>
            </button>
          </div>
            :
            null
        }

        {
          accounts.length > 0 && !selectedAccount ?
            (
              <div className='z-10 bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700'>
                <select className='py-2 text-sm text-gray-700 dark:text-gray-200' onChange={handleAccountSelection} >
                  <option className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white" value="" disabled selected hidden > Choose your account </option>
                  {accounts.map((account) => (
                    <option className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white" value={account.address} > {account.meta.name} : {account.address} </option>
                  ))}
                </select>
              </div>
            ) : null
        }

      </div> */}

      {/* UTILITY FIRST LIBRARY  */}
      {/* {selectedAccount || cookieAccount != "undefined" ? */}
      {cookieAccount == undefined ? 
        <div className="flex flex-row bg-[#1A1B1E] h-[90vh]">

          <div className="context text-white w-[50vw] flex flex-col p-24 gap-7">
            
            <div className="heading">
              
              <p className="text-4xl">
              About Data Relay X
              </p>
            </div>

            <div className="subheading">

              <p className="text-base">
              The Data Relay X application stands at the forefront of modern reconnaissance technology, offering unparalleled capabilities in gathering, processing, and disseminating critical information from swarm troops. As a decentralized platform built for military intelligence operations, Data Relay X leverages cutting-edge technologies to empower commanders with real-time insights into aerial swarm troop activities. 
              </p>
              <br />
              <p>
                By harnessing the power of peer-to-peer communications and blockchain technology, this innovative tool
                ensures the seamless exchange of metadata between unmanned aerial vehicles (UAVs) and ground stations,
                  facilitating enhanced situational awareness and decision-making on the battlefield.              
              </p>
            </div>

            <div className="button">

              <a href="https://maroon-profit-6d5.notion.site/Data-Relay-X-8d52476369104499a5086ef1ebcfe84a" target='_blank' >
                <div 
                  className="text-white cursor-pointer bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  >
                Read the docs
                </div>
              </a>

            </div>
          </div>

          <div className="image text-white w-[50vw] relative content-center">
 

          <div className='logo w-[25vw] mx-44 ' style={{ backgroundImage: `url(${gradient})` }}>
            <img className='w-[25vw]' src={bigLogo} alt="" />
          </div> 
          {/* <div className='logo w-[25vw] mx-44 '>
            <img className='w-[25vw]' src={gradient} alt="" />
          </div> */}

                       
          </div>

        </div> 

      
      : null 
      }


      {/* { cookieAccount == undefined ? 
      
        <div>

        </div>
        : null 
    } */}

      {cookieAccount != undefined ?
        <div className="flex flex-row">
          <div className="flex h-[100vh] ">

            <div id="dropdown"
              className=
              {`
                    z-50 absolute right-0 group-hover:block my-1 text-base list-none bg-black divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700 dark:divide-gray-600 
                    ${isOpen ? "" : "hidden"
                }`}
            >
              {/* <div className="px-4 py-3">
                <span className="block text-sm text-white dark:text-white">{cookieObject?.meta?.name || selectedAccount.meta.name}</span>
                <span className="block text-sm text-gray-400 truncate ">     {cookieObject?.address || selectedAccount.address} </span>
              </div> */}

              {/* {selectedAccount && (
                <div className="px-4 py-3">
                  <span className="block text-sm text-white dark:text-white">{selectedAccount.meta.name}</span>
                  <span className="block text-sm text-gray-400 truncate ">     {selectedAccount.address} </span>
                </div>
              )}

              {cookieObject && (
                <div className="px-4 py-3">
                  <span className="block text-sm text-white dark:text-white">{cookieObject?.meta?.name}</span>
                  <span className="block text-sm text-gray-400 truncate ">     {cookieObject?.address} </span>
                </div>
              )} */}


              {/* {selectedAccount ? (
                <div className="px-4 py-3">
                  <span className="block text-sm text-white dark:text-white">{selectedAccount.meta.name}</span>
                  <span className="block text-sm text-gray-400 truncate ">     {selectedAccount.address} </span>
                </div>
              ) : null} */}

              {cookieObject ? (
                <div className="px-4 py-3">
                  <span className="block text-sm text-white dark:text-white">{cookieObject?.meta?.name}</span>
                  <span className="block text-sm text-gray-400 truncate ">     {cookieObject?.address} </span>
                </div>
              ) : null}


              <ul className="py-2" >
                <li>
                  <a href="#" onClick={() => {
                    Cookies.remove("wallet");
                    window.location.reload();
                  }} className="block px-4 py-2 text-sm text-white hover:bg-gray-100 hover:text-black ">Sign out Transaction</a>
                </li>
              </ul>
            </div>
            <div className='flex flex-col bg-[#201F2D] p-3 gap-3 w-[25vw]' >

              {/* <input type='text' className="search bg-[#302D38] rounded-2xl h-[7vh] text-white  " placeholder='Enter Drone Id' /> */}

              <input
                type="text"
                className="search bg-[#302D38] rounded-2xl h-[7vh] text-white"
                placeholder="Enter Drone Id"
                value={searchQuery}
                onChange={handleSearchInputChange}
              />

              <div className="list h-[90vh] overflow-scroll cursor-pointer gap-2 bg-[#302D38] rounded-2xl p-2">
                {/* {dataList.map((data, index) => ( */}
                {filteredDataList.map((data, index) => (
                  <div key={index}
                    className={`flex flex-row justify-between items-center content-center border-black w-[330px] h-[60px] p-2.5 rounded-2xl ${selectedDataIndex === index ? 'bg-[#201F2D]' : ''
                      }`}
                  >
                    <div className="head flex gap-6 items-center truncate text-white" onClick={() => handleDataClick(index)}>
                      {/* <img src={vehicleImageSrc} className='w-[45px] h-[45px]' alt="drone" /> */}
                      {data.droneId.charAt(Math.floor(data.droneId.length / 2)).match(/[a-z]/) && (
                        <img src={drone} className='w-[45px] h-[45px]' alt="drone" />
                      )}
                      {data.droneId.charAt(Math.floor(data.droneId.length / 2)).match(/[5-9]/) && (
                        <img src={flight} className='w-[45px] h-[45px]' alt="flight" />
                      )}
                      {data.droneId.charAt(Math.floor(data.droneId.length / 2)).match(/[0-4]/) && (
                        <img src={jet} className='w-[45px] h-[45px]' alt="jet" />
                      )}
                      <p className='w-[135px] truncate' >{data.droneId}</p>
                    </div>

                    <div className="tail flex gap-3 items-center">
                      <button onClick={handleDownloadClick} >
                        <img src={download} alt="download" className='w-[25px] h-[25px]' />
                        {/* <i className="fa fa-download" aria-hidden="true"></i> */}
                      </button>
                      <button onClick={() => handleDataClick(index)} >
                        <img src={view} alt="view" onClick={() => handleDataClick(index)} className='w-[25px] h-[25px]' />
                        {/* <i className="fa-solid fa-eye"></i> */}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {selectedDataIndex !== null && (

              <div className='info flex flex-col p-3 gap-1 bg-[#201F2D] text-white w-[20vw] transform transition-all duration-1000 ease-out  ' key={selectedDataIndex}>

                <div className="id bg-[#302D38] rounded-2xl h-[7vh] items-center flex justify-between p-2.5">

                  <div className='flex gap-4 items-center truncate' >
                    <i className="fa-solid fa-angle-right"></i>
                    <p className='w-[200px] truncate' >{dataList[selectedDataIndex].droneId}</p>
                  </div>

                  <button className='text-2xl' onClick={() => { setSelectedDataIndex(null) }} ><i className="fa-regular fa-circle-xmark"></i></button>
                </div>



                <div className="location bg-[#302D38] rounded-2xl h-[30vh] flex flex-col gap-4 p-4 ">

                  <div className="area flex gap-5 items-center">
                    <i className="fa-solid fa-location-dot"></i>
                    <div>
                      <p>Area 51</p>
                      <p>GVPCOE</p>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <TextBox1 head="lg" heading="Latitude" subheading={`${dataList[selectedDataIndex].location.latitude}  `} />
                    <TextBox1 head="lg" heading="Longitude" subheading={`${dataList[selectedDataIndex].location.longitude} `} />
                  </div>

                  <div className="flex justify-between">
                    <TextBox1 head="lg" heading="Cluster Head" subheading="DRN59641376953" />
                    {/* <TextBox1 heading="Longitude" subheading={`${dataList[selectedDataIndex].location.longitude} `} /> */}
                  </div>

                </div>



                <div className="metaData bg-[#302D38] rounded-2xl h-[60vh] flex flex-col gap-3 p-4 ">

                  <div className="flex flex-col gap-2">
                    <h1>Transaction meta data</h1>
                    <div className="flex justify-between">
                      <TextBox1 head="sm" heading="Sender" subheading={`${dataList[selectedDataIndex].sender}  `} />
                      <TextBox1 head="sm" heading="Receiver" subheading={`${dataList[selectedDataIndex].receiver} `} />
                    </div>

                    <TextBox1 head="sm" heading="Transaction Id" subheading={`${dataList[selectedDataIndex].transactionId} `} />
                    <TextBox1 head="sm" heading="Transaction type" subheading={`${dataList[selectedDataIndex].transactionType} `} />

                  </div>

                  <div className="flex flex-col gap-2">
                    <h1>Transmission meta data</h1>
                    <div className="flex justify-between">
                      <TextBox1 head="sm" heading="Modality" subheading={`${dataList[selectedDataIndex].dataCategory}  `} />
                      <TextBox1 head="sm" heading="Data format" subheading={`${dataList[selectedDataIndex].dataFormat} `} />
                    </div>

                    <TextBox1 head="sm" heading="Data size" subheading={`${dataList[selectedDataIndex].dataSize} `} />

                  </div>

                  <div className="flex flex-col">
                    <h1>Sensor data</h1>
                    <div className="flex justify-between">
                      <TextBox1 head="sm" heading="Temperature" subheading={`${dataList[selectedDataIndex].additionalInfo.temperature}  `} />
                      <TextBox1 head="sm" heading="Humidity" subheading={`${dataList[selectedDataIndex].additionalInfo.humidity} `} />
                    </div>
                  </div>

                </div>

              </div>
            )}


          </div>





          <div className={`${selectedDataIndex !== null ? ['w-[55vw]'] : ['w-[75vw]']} overflow-hidden`}>

            <Map
              latitude={selectedDataIndex !== null ? dataList[selectedDataIndex].location.latitude : 7.2905715}
              longitude={selectedDataIndex !== null ? dataList[selectedDataIndex].location.longitude : 80.6337262}
              style={{ width: '100%', height: '100%' }}
            />
          </div>

        </div> : null
      }




      {/* <div >
        {selectedAccount ?
          <div className='flex flex-row ' >

            <div>

              Address : {selectedAccount.address} | {selectedAccount.meta.name}
              {dataList.length}
              {dataList.map((data, index) => (
                <div key={index} >
                  <p>Transaction ID: {data.transactionId}</p>
                  <p>Drone ID: {data.droneId}</p>
                  <p>Transaction Type: {data.transactionType}</p>
                  <p>Data Category: {data.dataCategory}</p>
                  <p>Data Format: {data.dataFormat}</p>
                  <p>Data Size: {data.dataSize}</p>
                  <p>Sender: {data.sender}</p>
                  <p>Receiver: {data.receiver}</p>
                  <p>Location: {`Latitude: ${data.location.latitude}, Longitude: ${data.location.longitude}`}</p>
                  <p>Additional Info: </p>
                  <ul>
                    <li>Temperature: {data.additionalInfo.temperature} °F</li>
                    <li>Humidity: {data.additionalInfo.humidity} g.m-3</li>
                  </ul>
                </div>
              ))}
            </div>

            <div className='w-[60%]' >
              <Map />
            </div>

          </div>

          :
          null
        }
      </div> */}


      <script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.3.0/flowbite.min.js"></script>
    </div>

  );
}

export default App



  // const handleBurn = async () => {
  //   if (!api || !selectedAccount)
  //     return;

  //   const injector = await web3FromAddress(selectedAccount.address);

  //   const response = await api.tx.currencies.burnFren(AMOUNT).signAndSend(selectedAccount.address, {
  //     signer: injector.signer
  //   });

  //   if (response)
  //     console.log("Burn response : ", response);
  //   else
  //     console.log("No Frens burnt ");

  // }


  // Encryption - Decryption 
  // Function to generate a random 32-byte secret key
  // function generateSecretKey(): Uint8Array {
  //   return nacl.randomBytes(nacl.secretbox.keyLength);
  // }

  // // Function to generate a random 12-byte nonce
  // function generateNonce(): Uint8Array {
  //   return nacl.randomBytes(nacl.secretbox.nonceLength);
  // }

  // Function to encrypt plaintext using ChaCha20-Poly1305
  // function encrypt(plaintext: string, key: Uint8Array, nonce: Uint8Array): Uint8Array {
  //   const encodedPlaintext = Buffer.from(plaintext, 'utf8');
  //   const ciphertext = nacl.secretbox(encodedPlaintext, nonce, key);
  //   return ciphertext;
  // }

  // // Function to decrypt ciphertext using ChaCha20-Poly1305
  // function decrypt(ciphertext: Uint8Array, key: Uint8Array, nonce: Uint8Array): string | null {
  //   try {
  //     const decrypted = nacl.secretbox.open(ciphertext, nonce, key);
  //     if (!decrypted) {
  //       throw new Error('Failed to decrypt ciphertext');
  //     }
  //     return Buffer.from(decrypted).toString('utf8');
  //   } catch (error) {
  //     console.error('Decryption error:', error);
  //     return null;
  //   }
  // }

  // function decryptFromString(ciphertextString: string, key: Uint8Array, nonce: Uint8Array): string | null {
  //   // Convert the base64-encoded ciphertext string back to a Uint8Array
  //   const ciphertext = Buffer.from(ciphertextString, 'base64');

  //   try {
  //     const decrypted = nacl.secretbox.open(ciphertext, nonce, key);
  //     if (!decrypted) {
  //       throw new Error('Failed to decrypt ciphertext');
  //     }
  //     return Buffer.from(decrypted).toString('utf8');
  //   } catch (error) {
  //     console.error('Decryption error:', error);
  //     return null;
  //   }
  // }