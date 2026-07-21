import { Country } from "country-state-city";

const isoCodeByCountryName = new Map(
  Country.getAllCountries().map((country) => [country.name.toLocaleLowerCase(), country.isoCode]),
);

export function flagFromIsoCode(isoCode: string) {
  return isoCode
    .toUpperCase()
    .replace(/./g, (character) => String.fromCodePoint(127397 + character.charCodeAt(0)));
}

export function flagFromCountryName(countryName: string) {
  const isoCode = isoCodeByCountryName.get(countryName.trim().toLocaleLowerCase());
  return isoCode ? flagFromIsoCode(isoCode) : "";
}
