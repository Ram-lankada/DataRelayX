import { WsProvider, ApiPromise } from '@polkadot/api';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
// import { randomBytes } from "crypto"; // Import for random string generation
// import { random as seededRandom } from 'seedrandom';
// declare module 'seedrandom';
import * as CryptoJS from 'crypto-js';
import BN from 'bn.js';
import { ChangeEvent, useEffect, useState } from 'react';
import profile from '../../static/profile.png';
import logo from '../../static/logo.png';
import drone from '../../static/drone.png';
import flight from '../../static/flight.png';
import download from '../../static/download.png';
import view from '../../static/view.png';
import Map from '../../Components/map.jsx';
import ReactDOM from 'react-dom';
// import './index.css';

const NAME = "DataRelayX";
type Period = "MORNING" | "NIGHT" | "MIDONE" | "MIDTWO";
const AMOUNT = new BN(10).mul(new BN(10).pow(new BN(12)));
const length = 10;


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
  const [selectedDataIndex, setSelectedDataIndex] = useState(null);
  // const [balance, setBalance] = useState<BN>();

  const setup = async () => {
    const wsProvider = new WsProvider("wss://ws.gm.bldnodes.org/");
    const api = await ApiPromise.create({ provider: wsProvider });
    setApi(api);
  };

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

  }



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


  // Google maps service

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
      return "AVIG";
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

  const decodeMetaData = (parsedMetaData: string, timestamp: number): DecodedMetaData => {
    const MetaData = padMetaData(parsedMetaData);
    // const MetaData = (parsedMetaData);

    const decodedData = {
      timestamp: (timestamp + 1),
      transactionId: decodeTransactionId(MetaData),
      droneId: decodeDroneId(MetaData),
      transactionType: decodeTransactionType(MetaData),
      dataCategory: decodeDataCategory(MetaData),
      dataFormat: decodeDataFormat(MetaData),
      dataSize: decodeDataSize(MetaData),
      sender: decodeSender(MetaData),
      receiver: decodeReceiver(MetaData),
      location: decodeLocation(MetaData),
      additionalInfo: decodeAdditionalInfo(MetaData),
    };

    return decodedData;
  };




  useEffect(() => {
    setup();
  }, []);

  useEffect(() => {
    if (!api)
      return;

    (async () => {

      // for (let i = 0; i < length; i++) {

      setTimeout(async () => {

      const timestamp = (await api.query.timestamp.now()).toPrimitive();
      const metaData = (await api.query.currencies.currentTimePeriod()).toPrimitive() as string;
      const parsedMetaData = metaData.toUpperCase() as Period;

      setPeriod(parsedMetaData);

      const decodedData = decodeMetaData(parsedMetaData, Number(timestamp));
      setDataList((prevDataList) => [...prevDataList, decodedData]);
      // setDataList([decodedData]);
      }, 10000);

      // }

    })();

  });

  let location: Number[] = [
    72.943, 24.2621
  ]
  function handleDataClick(index: number): void {
    setSelectedDataIndex(index);

  }

  const handleDownloadClick = () => {
    if (selectedDataIndex !== null) {
      const selectedData = dataList[selectedDataIndex];
      const jsonData = JSON.stringify(selectedData, null, 2);

      // Create a Blob and trigger download
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `data_${selectedDataIndex}.json`;
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

  return (
    <div>

      <nav className="bg-black border-gray-200 dark:bg-gray-900">
        <div className="w-full flex flex-wrap items-center justify-between p-4">
          <a href="https://flowbite.com/" className="flex items-center space-x-3 rtl:space-x-reverse">
            <img src={logo} className="h-8" alt="Flowbite Logo" />
            <span className="self-center font-semibold whitespace-nowrap text-white text-base dark:text-white"> Data Relay X</span>
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

            {selectedAccount ?
              <div>
                <button type="button" className="flex text-sm bg-gray-800 rounded-full md:me-0 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600" id="user-menu-button" aria-expanded="false" data-dropdown-toggle="user-dropdown" data-dropdown-placement="bottom">
                  <span className="sr-only">Open user menu</span>
                  <img className="w-8 h-8 rounded-full" src={profile} alt="user photo" />
                </button>
                <div className="z-50 hidden my-4 text-base list-none bg-black divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700 dark:divide-gray-600" id="user-dropdown">
                  <div className="px-4 py-3">
                    <span className="block text-sm text-white dark:text-white">{selectedAccount.meta.name}</span>
                    <span className="block text-sm text-white truncate dark:text-gray-400 "> {selectedAccount.address} </span>
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
          <div className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1" id="navbar-user">
            <ul className="flex flex-col font-medium p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-black dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
              <li>
                <a href="#" className="block py-2 px-3 text-white bg-blue-700 rounded md:bg-transparent md:text-blue-700 md:p-0 md:dark:text-blue-500" aria-current="page">Plan Mission</a>
              </li>
              <li>
                <a href="#" className="block py-2 px-3 text-white rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700">Attack</a>
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


      {selectedAccount ?
        <div className="flex flex-row">
          <div className="flex flex-row">
            <div className='w-[50%]' >
              <div className="search">

              </div>

              <div className="list h-[100vh] overflow-scroll cursor-pointer  gap-2">
                {dataList.map((data, index) => (
                  <div key={index} className='flex flex-row justify-between border-black' onClick={() => handleDataClick(index)} >

                    <div className="head flex">

                      <img src={drone} alt="drone" />   :  {data.droneId}

                    </div>

                    <div className="tail flex gap-1">

                      <button>
                        <img src={download} alt="download" onClick={handleDownloadClick} />
                      </button>
                      <button>
                        <img src={view} alt="view" onClick={() => handleDataClick(index)} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {selectedDataIndex !== null && (
              <div className='info w-[50%] flex flex-col gap-2' key={selectedDataIndex}>

                <div className="id">
                  <p>Drone ID: {dataList[selectedDataIndex].droneId}</p>
                </div>

                <div className="location">
                  <button className='text-2xl' onClick={() => { setSelectedDataIndex(null) }} >close</button>

                  <p>Location: {`Latitude: ${dataList[selectedDataIndex].location.latitude}, Longitude: ${dataList[selectedDataIndex].location.longitude}`}</p>
                </div>

                <div className="metaData">
                  <p>Transaction ID: {dataList[selectedDataIndex].transactionId}</p>

                  <p>Transaction Type: {dataList[selectedDataIndex].transactionType}</p>
                  <p>Data Category: {dataList[selectedDataIndex].dataCategory}</p>
                  <p>Data Format: {dataList[selectedDataIndex].dataFormat}</p>
                  <p>Data Size: {dataList[selectedDataIndex].dataSize}</p>
                  <p>Sender: {dataList[selectedDataIndex].sender}</p>
                  <p>Receiver: {dataList[selectedDataIndex].receiver}</p>
                  <p>Additional Info: </p>
                  <ul>
                    <li>Temperature: {dataList[selectedDataIndex].additionalInfo.temperature} °F</li>
                    <li>Humidity: {dataList[selectedDataIndex].additionalInfo.humidity} g.m-3</li>
                  </ul>
                </div>

              </div>
            )}


          </div>

          <div className={`w-${selectedDataIndex !== null ? ['50%'] : ['75%']}`}>
            <Map
              latitude={selectedDataIndex !== null ? dataList[selectedDataIndex].location.latitude : 7.2905715}
              longitude={selectedDataIndex !== null ? dataList[selectedDataIndex].location.longitude : 80.6337262}
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



    </div>

  );
}

export default App


