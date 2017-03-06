declare module "ractive" {let Any: any; export = Any;}
declare module "director" {let Any: any; export = Any;}
declare module "whatwg-fetch" {let Any: any; export = Any;}
declare module "dc" {let Any: any; export = Any;}
declare module "d3" {let Any: any; export = Any;}
declare module "crossfilter" {let Any: any; export = Any;}
declare module "leaflet" {let Any: any; export = Any;}
declare module "myers" {let Any: any; export = Any;}
declare module "utils" {let Any: any; export = Any;}
declare module "vis" {let Any: any; export = Any;}
declare module "ractive-tooltip" {let Any: any; export = Any;}
declare module "ractive-events-keys" {let Any: any; export = Any;}
//declare module "jquery" {let Any: any; export = Any;}
// declare module "moment" {let Any: any; export = Any;}
/*
interface BudgetPriceRecord {
    date: string,
    dateParsed: Date,
    month: string,
    marketPrice: number,
    estimatedPrice: number
}*/

interface BudgetAssetRecord {
    date: string,
    dateParsed: Date,
    monthParsed: Date,
    assetId : string,
    producedEnergy: number,
    meteoEstimatedEnergy: number,
    innogyPrevisionedEnergy: number,
    realPenalties: number,
    estimatedPenalties: number,
    marketPrice: number,
    estimatedPrice: number,
    riIncome: number,
    productionIncome: number,
    totalIncome: number,
    estimatedIncome: number,
    /*this one is from cscada*/
    cscadaEnergy: number
}

interface DeviceRecord {
    deviceId: string,
    date: string,
    dateParsed: Date,
    energy: number,
    wind: number,
    available: number,
    maintenance: number,
    manualStop: number,
    error: number,
    disconnected: number
}

interface AssetRecord {
    date: string,
    dateParsed: Date,
    dailyPrice: number,
    intradailyPrice: number,
    estimatedEnergy: number,
    energy: number,
    cosPhi: number,
    maxCosPhi: number,
    minCosPhi: number
}

interface FinancialRecord {
    date: string,
    dateParsed: Date,
    energy: number,
    estimatedEnergy: number,
    price: number,
    income: number,
    estimatedIncome: number,
    penalties: number
}

interface RealTimeRecord {
    date: string,
    dateParsed: Date,
    cosPhi: number,
    maxCosPhi: number,
    minCosPhi: number,
    wind: number,
    activePower: number,
    nominalPower: number,
    setPointReceived: number
}

interface Point {
    key: any,
    value: any
}

interface Signal {
    Name: string,
    LastValue: any,
    Value: any,
    Timestamp: string,
    Quality: number   
}

interface Device {
    id: string,
    model: string,
    signals: { [groupId: string]: Signal }
}

interface Marker {
    id: string,
    name: string
    type: "park" | "hydro" | "solar" | "default" | "parkalert" | "hydroalert" | "solaralert" | "defaultalert",
    latitude: number,
    longitude: number,
    WeatherAlertMsg: string,
    WeatherAlertInfo: string,
    NominalPower: string,
    WindSpeed: string,
    WindDirection: string,
    ActivePower: string,
    ReactivePower: string,
    Temperature: string
    
}

type Availability = "available" | "stopped" | "maintenance" | "error" | "disconnected";

interface Asset {
    id: string,
    viewLevel: string,
    name: string,
    pages: {},
    pagesData: any,
    servicesData: any,
    signals: Signal[],
    nominalPower: number,
    powerAds: boolean
}

interface DeviceModel {
    getAvailability: (signals: {[groupId: string]: Signal}) => Availability,
    getStatusDescription: (signals: {[groupId: string]: Signal}) => string,     
    // getStatusColor: (signals: Signal[]) => string,    
    // getOrderItem: (signals: Signal[]) => string,
}

interface DeviceModelService {
    init: () => Promise<{}>,
    models: {[modelId: string]: DeviceModel}
}

interface DisplaySignal {
    name: string,
    signalName: string,
    signal: Signal
    decimals?: number,
    units?: string,
}