// apps/mobile/src/utils/locationData.ts

export interface LocationEntry {
  name: string
  states: {
    name: string
    cities: string[]
  }[]
}

export const AFRICA_LOCATIONS: LocationEntry[] = [
  {
    name: "Nigeria",
    states: [
      { name: "Lagos", cities: ["Ikeja", "Lekki", "Victoria Island", "Surulere", "Ajah", "Badagry", "Epe", "Ikorodu"] },
      { name: "Abuja (FCT)", cities: ["Garki", "Wuse", "Maitama", "Asokoro", "Gwarinpa", "Kubwa", "Lugbe"] },
      { name: "Rivers", cities: ["Port Harcourt", "Obio-Akpor", "Bonny", "Eleme"] },
      { name: "Oyo", cities: ["Ibadan", "Ogbomosho", "Iseyin"] },
      { name: "Kano", cities: ["Kano City", "Gwale", "Fagge"] },
      { name: "Anambra", cities: ["Awka", "Onitsha", "Nnewi"] },
      { name: "Edo", cities: ["Benin City", "Auchi", "Ekpoma"] },
      { name: "Delta", cities: ["Warri", "Asaba", "Sapele", "Ughelli"] },
      { name: "Akwa Ibom", cities: ["Uyo", "Eket", "Ikot Ekpene"] },
      { name: "Kaduna", cities: ["Kaduna City", "Zaria", "Kafanchan"] },
      { name: "Enugu", cities: ["Enugu City", "Nsukka"] },
      { name: "Ogun", cities: ["Abeokuta", "Ijebu Ode", "Sango Ota", "Ilaro"] },
    ]
  },
  {
    name: "Ghana",
    states: [
      { name: "Greater Accra", cities: ["Accra", "Tema", "Madina", "Ashaiman"] },
      { name: "Ashanti", cities: ["Kumasi", "Obuasi", "Ejisu"] },
      { name: "Western", cities: ["Sekondi-Takoradi", "Tarkwa"] },
      { name: "Central", cities: ["Cape Coast", "Winneba", "Kasoa"] },
      { name: "Eastern", cities: ["Koforidua", "Nkawkaw"] },
      { name: "Northern", cities: ["Tamale"] },
    ]
  },
  {
    name: "Kenya",
    states: [
      { name: "Nairobi", cities: ["Nairobi City", "Westlands", "Dagoretti", "Kasarani"] },
      { name: "Mombasa", cities: ["Mombasa City", "Nyali", "Likoni", "Changamwe"] },
      { name: "Kisumu", cities: ["Kisumu City"] },
      { name: "Kiambu", cities: ["Thika", "Kiambu Town", "Ruiru"] },
      { name: "Nakuru", cities: ["Nakuru City", "Naivasha"] },
    ]
  },
  {
    name: "South Africa",
    states: [
      { name: "Gauteng", cities: ["Johannesburg", "Pretoria", "Sandton", "Soweto"] },
      { name: "Western Cape", cities: ["Cape Town", "Stellenbosch", "Paarl"] },
      { name: "KwaZulu-Natal", cities: ["Durban", "Pietermaritzburg", "Umhlanga"] },
      { name: "Eastern Cape", cities: ["Gqeberha (Port Elizabeth)", "East London"] },
    ]
  },
  {
    name: "Rwanda",
    states: [
      { name: "Kigali", cities: ["Nyarugenge", "Gasabo", "Kicukiro"] },
      { name: "Northern Province", cities: ["Musanze", "Byumba"] },
      { name: "Eastern Province", cities: ["Rwamagana", "Kayonza"] },
      { name: "Western Province", cities: ["Rubavu", "Karongi"] },
      { name: "Southern Province", cities: ["Huye", "Muhanga"] },
    ]
  },
  {
    name: "Senegal",
    states: [
      { name: "Dakar", cities: ["Dakar City", "Pikine", "Guédiawaye", "Rufisque"] },
      { name: "Thiès", cities: ["Thiès City", "Mbour", "Tivaouane"] },
      { name: "Saint-Louis", cities: ["Saint-Louis City"] },
    ]
  },
  {
    name: "Uganda",
    states: [
      { name: "Central", cities: ["Kampala", "Entebbe", "Mukono"] },
      { name: "Western", cities: ["Mbarara", "Fort Portal"] },
      { name: "Eastern", cities: ["Jinja", "Mbale"] },
    ]
  }
]
