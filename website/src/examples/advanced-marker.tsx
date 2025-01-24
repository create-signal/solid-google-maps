import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-solid'
import { AdvancedMarker, APIProvider, Map } from 'solid-google-maps'
import { Component, createMemo, createSignal } from 'solid-js'
import { cn } from '~/lib/utils'
import './advanced-marker/advanced-marker.css'
import './advanced-marker/real-estate-gallery.css'
import './advanced-marker/real-estate-listing-details.css'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export default function App() {
  return (
    <div class="advanced-marker-example w-full">
      <APIProvider apiKey={API_KEY}>
        <Map
          style={{ height: '500px', width: '100%' }}
          mapId={'bf51a910020fa25a'}
          defaultZoom={5}
          defaultCenter={{ lat: 47.53, lng: -122.34 }}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
        >
          <CustomAdvancedMarker realEstateListing={realEstateListing} />
        </Map>
      </APIProvider>
    </div>
  )
}

export const CustomAdvancedMarker: Component<{ realEstateListing: RealEstateListing }> = (props) => {
  const [clicked, setClicked] = createSignal(false)
  const [hovered, setHovered] = createSignal(false)

  const position = createMemo(() => ({
    lat: props.realEstateListing.details.latitude,
    lng: props.realEstateListing.details.longitude,
  }))

  return (
    <>
      <AdvancedMarker
        position={position()}
        title={'AdvancedMarker with custom html content.'}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        class={cn('real-estate-marker', { clicked: clicked(), hovered: hovered() })}
        onClick={() => setClicked(!clicked())}
      >
        <div class="custom-pin">
          <button class="close-button">
            <span class="material-symbols-outlined"> close </span>
          </button>

          <div class="image-container">
            <RealEstateGallery images={realEstateListing.images} isExtended={clicked()} />
            <span class="icon">
              <RealEstateIcon />
            </span>
          </div>

          <RealEstateListingDetails details={realEstateListing.details} />
        </div>

        <div class="tip" />
      </AdvancedMarker>
    </>
  )
}

const RealEstateListingDetails: Component<{ details: RealEstateListingDetails }> = (props) => {
  return (
    <div class="details-container">
      <div class="listing-content">
        <h2>{props.details.listing_title}</h2>
        <p>{props.details.property_address}</p>
        <div class="details">
          <div class="detail_item">
            <FloorplanIcon /> {props.details.property_square_feet.replace('sq ft', 'ft²')}
          </div>
          <div class="detail_item">
            <BathroomIcon /> {props.details.property_bathrooms}
          </div>
          <div class="detail_item">
            <BedroomIcon /> {props.details.property_bedrooms}
          </div>
        </div>

        <p class="description">{props.details.listing_description}</p>

        <p class="price">{getFormattedCurrency(props.details.property_price)}</p>
      </div>
    </div>
  )
}

const RealEstateGallery: Component<{ images: string[]; isExtended: boolean }> = (props) => {
  const [currentImageIndex, setCurrentImageIndex] = createSignal(0)

  const handleBack = (event: MouseEvent) => {
    event.stopPropagation()
    if (currentImageIndex() > 0) {
      setCurrentImageIndex(currentImageIndex() - 1)
    }
  }

  const handleNext = (event: MouseEvent) => {
    event.stopPropagation()
    if (currentImageIndex() < props.images.length - 1) {
      setCurrentImageIndex(currentImageIndex() + 1)
    }
  }

  return (
    <div class={`photo-gallery ${props.isExtended ? 'extended' : ''}`}>
      <img src={props.images[currentImageIndex()]} alt="Real estate listing photo" />

      <div class="gallery-navigation">
        <div class="nav-buttons">
          <button onClick={handleBack} disabled={currentImageIndex() === 0}>
            <ChevronLeftIcon />
          </button>
          <button onClick={handleNext} disabled={currentImageIndex() === props.images.length - 1}>
            <ChevronRightIcon />
          </button>
        </div>
        <div class="indicators">
          {props.images.map((_, index) => (
            <span class={`dot ${index === currentImageIndex() ? 'active' : ''}`}></span>
          ))}
        </div>
      </div>
    </div>
  )
}

const RealEstateIcon = () => (
  <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 0H0V30H30V0Z" fill="#B88B2E" />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M15 30C23.2843 30 30 23.2842 30 15C30 6.7157 23.2843 0 15 0C6.71578 0 0 6.7157 0 15C0 23.2842 6.71578 30 15 30Z"
      fill="#B88B2E"
    />
    <path
      d="M10 20.75V13.8875L7.9 15.5L7 14.3L15.25 8L18.25 10.2875V8.75H20.5V12.0125L23.5 14.3L22.6 15.5L20.5 13.8875V20.75H16V16.25H14.5V20.75H10ZM11.5 19.25H13V14.75H17.5V19.25H19V12.7438L15.25 9.89375L11.5 12.7438V19.25ZM13.75 13.2688H16.75C16.75 12.8688 16.6 12.5406 16.3 12.2844C16 12.0281 15.65 11.9 15.25 11.9C14.85 11.9 14.5 12.0281 14.2 12.2844C13.9 12.5406 13.75 12.8688 13.75 13.2688Z"
      fill="white"
    />
  </svg>
)

const FloorplanIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1.3335" y="6" width="1.33333" height="7.33333" fill="currentColor" />
    <rect x="1.3335" y="2.66699" width="1.33333" height="1.33333" fill="currentColor" />
    <rect x="13.3335" y="2.66699" width="1.33333" height="10.6667" fill="currentColor" />
    <rect width="1.33333" height="4.66667" transform="matrix(1 0 0 -1 8.66699 13.3335)" fill="currentColor" />
    <rect x="6.66699" y="7.3335" width="3.33333" height="1.33333" fill="currentColor" />
    <rect x="12" y="7.3335" width="1.33333" height="1.33333" fill="currentColor" />
    <path
      d="M1.3335 13.3335H14.6668C14.6668 14.0699 14.0699 14.6668 13.3335 14.6668H2.66683C1.93045 14.6668 1.3335 14.0699 1.3335 13.3335Z"
      fill="currentColor"
    />
    <rect x="2.66699" y="7.3335" width="2" height="1.33333" fill="currentColor" />
    <path
      d="M1.3335 2.66683C1.3335 1.93045 1.93045 1.3335 2.66683 1.3335H13.3335C14.0699 1.3335 14.6668 1.93045 14.6668 2.66683H1.3335Z"
      fill="currentColor"
    />
  </svg>
)

const BedroomIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3.3335 11.3333H4.3335V10.3333H11.6668V11.3333H12.6668V8.76659C12.6668 8.53325 12.6224 8.31381 12.5335 8.10825C12.4446 7.9027 12.3224 7.72214 12.1668 7.56659V5.99992C12.1668 5.63325 12.0363 5.31936 11.7752 5.05825C11.5141 4.79714 11.2002 4.66659 10.8335 4.66659H8.66683C8.54461 4.66659 8.42794 4.68325 8.31683 4.71659C8.20572 4.74992 8.10016 4.79992 8.00016 4.86659C7.90016 4.79992 7.79461 4.74992 7.6835 4.71659C7.57239 4.68325 7.45572 4.66659 7.3335 4.66659H5.16683C4.80016 4.66659 4.48627 4.79714 4.22516 5.05825C3.96405 5.31936 3.8335 5.63325 3.8335 5.99992V7.56659C3.67794 7.72214 3.55572 7.9027 3.46683 8.10825C3.37794 8.31381 3.3335 8.53325 3.3335 8.76659V11.3333ZM4.3335 9.33325V8.66659C4.3335 8.4777 4.39739 8.31936 4.52516 8.19159C4.65294 8.06381 4.81127 7.99992 5.00016 7.99992H11.0002C11.1891 7.99992 11.3474 8.06381 11.4752 8.19159C11.6029 8.31936 11.6668 8.4777 11.6668 8.66659V9.33325H4.3335ZM4.8335 6.99992V5.66659H7.50016V6.99992H4.8335ZM8.50016 6.99992V5.66659H11.1668V6.99992H8.50016ZM2.66683 14.6666C2.30016 14.6666 1.98627 14.536 1.72516 14.2749C1.46405 14.0138 1.3335 13.6999 1.3335 13.3333V2.66659C1.3335 2.29992 1.46405 1.98603 1.72516 1.72492C1.98627 1.46381 2.30016 1.33325 2.66683 1.33325H13.3335C13.7002 1.33325 14.0141 1.46381 14.2752 1.72492C14.5363 1.98603 14.6668 2.29992 14.6668 2.66659V13.3333C14.6668 13.6999 14.5363 14.0138 14.2752 14.2749C14.0141 14.536 13.7002 14.6666 13.3335 14.6666H2.66683ZM2.66683 13.3333H13.3335V2.66659H2.66683V13.3333Z"
      fill="currentColor"
    />
  </svg>
)

export const BathroomIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6.00016 11.9999C6.18905 11.9999 6.34739 11.936 6.47516 11.8083C6.60294 11.6805 6.66683 11.5221 6.66683 11.3333C6.66683 11.1444 6.60294 10.986 6.47516 10.8583C6.34739 10.7305 6.18905 10.6666 6.00016 10.6666C5.81127 10.6666 5.65294 10.7305 5.52516 10.8583C5.39739 10.986 5.3335 11.1444 5.3335 11.3333C5.3335 11.5221 5.39739 11.6805 5.52516 11.8083C5.65294 11.936 5.81127 11.9999 6.00016 11.9999ZM8.00016 11.9999C8.18905 11.9999 8.34739 11.936 8.47516 11.8083C8.60294 11.6805 8.66683 11.5221 8.66683 11.3333C8.66683 11.1444 8.60294 10.986 8.47516 10.8583C8.34739 10.7305 8.18905 10.6666 8.00016 10.6666C7.81127 10.6666 7.65294 10.7305 7.52516 10.8583C7.39739 10.986 7.3335 11.1444 7.3335 11.3333C7.3335 11.5221 7.39739 11.6805 7.52516 11.8083C7.65294 11.936 7.81127 11.9999 8.00016 11.9999ZM10.0002 11.9999C10.1891 11.9999 10.3474 11.936 10.4752 11.8083C10.6029 11.6805 10.6668 11.5221 10.6668 11.3333C10.6668 11.1444 10.6029 10.986 10.4752 10.8583C10.3474 10.7305 10.1891 10.6666 10.0002 10.6666C9.81127 10.6666 9.65294 10.7305 9.52516 10.8583C9.39739 10.986 9.3335 11.1444 9.3335 11.3333C9.3335 11.5221 9.39739 11.6805 9.52516 11.8083C9.65294 11.936 9.81127 11.9999 10.0002 11.9999ZM6.00016 9.99992C6.18905 9.99992 6.34739 9.93603 6.47516 9.80825C6.60294 9.68047 6.66683 9.52214 6.66683 9.33325C6.66683 9.14436 6.60294 8.98603 6.47516 8.85825C6.34739 8.73047 6.18905 8.66659 6.00016 8.66659C5.81127 8.66659 5.65294 8.73047 5.52516 8.85825C5.39739 8.98603 5.3335 9.14436 5.3335 9.33325C5.3335 9.52214 5.39739 9.68047 5.52516 9.80825C5.65294 9.93603 5.81127 9.99992 6.00016 9.99992ZM8.00016 9.99992C8.18905 9.99992 8.34739 9.93603 8.47516 9.80825C8.60294 9.68047 8.66683 9.52214 8.66683 9.33325C8.66683 9.14436 8.60294 8.98603 8.47516 8.85825C8.34739 8.73047 8.18905 8.66659 8.00016 8.66659C7.81127 8.66659 7.65294 8.73047 7.52516 8.85825C7.39739 8.98603 7.3335 9.14436 7.3335 9.33325C7.3335 9.52214 7.39739 9.68047 7.52516 9.80825C7.65294 9.93603 7.81127 9.99992 8.00016 9.99992ZM10.0002 9.99992C10.1891 9.99992 10.3474 9.93603 10.4752 9.80825C10.6029 9.68047 10.6668 9.52214 10.6668 9.33325C10.6668 9.14436 10.6029 8.98603 10.4752 8.85825C10.3474 8.73047 10.1891 8.66659 10.0002 8.66659C9.81127 8.66659 9.65294 8.73047 9.52516 8.85825C9.39739 8.98603 9.3335 9.14436 9.3335 9.33325C9.3335 9.52214 9.39739 9.68047 9.52516 9.80825C9.65294 9.93603 9.81127 9.99992 10.0002 9.99992ZM4.66683 7.99992H11.3335V7.33325C11.3335 6.41103 11.0085 5.62492 10.3585 4.97492C9.7085 4.32492 8.92239 3.99992 8.00016 3.99992C7.07794 3.99992 6.29183 4.32492 5.64183 4.97492C4.99183 5.62492 4.66683 6.41103 4.66683 7.33325V7.99992ZM5.70016 6.99992C5.78905 6.43325 6.04739 5.95825 6.47516 5.57492C6.90294 5.19159 7.41127 4.99992 8.00016 4.99992C8.58905 4.99992 9.09739 5.19159 9.52516 5.57492C9.95294 5.95825 10.2113 6.43325 10.3002 6.99992H5.70016ZM2.66683 14.6666C2.30016 14.6666 1.98627 14.536 1.72516 14.2749C1.46405 14.0138 1.3335 13.6999 1.3335 13.3333V2.66659C1.3335 2.29992 1.46405 1.98603 1.72516 1.72492C1.98627 1.46381 2.30016 1.33325 2.66683 1.33325H13.3335C13.7002 1.33325 14.0141 1.46381 14.2752 1.72492C14.5363 1.98603 14.6668 2.29992 14.6668 2.66659V13.3333C14.6668 13.6999 14.5363 14.0138 14.2752 14.2749C14.0141 14.536 13.7002 14.6666 13.3335 14.6666H2.66683ZM2.66683 13.3333H13.3335V2.66659H2.66683V13.3333Z"
      fill="currentColor"
    />
  </svg>
)

export const getFormattedCurrency = (priceString: string) => {
  const price = parseFloat(priceString.replace('$', ''))
  return formatCurrency(price)
}

const formatCurrency = (price: number) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  return formatter.format(price)
}

const realEstateListing = {
  uuid: '82e41887-0605-48b2-bb54-458eda8b7726',
  details: {
    property_type: 'Townhouse',
    property_address: '5468 Becky Pass Apt. 215, Seattle, WA 98169',
    property_bedrooms: 1,
    property_bathrooms: 3,
    property_square_feet: '1404 sq ft',
    property_lot_size: '3710 sq ft',
    property_price: '$1075859',
    property_year_built: 2013,
    property_adjective: 'modern',
    property_material: 'grey Douglas Fir Wood and Concrete',
    property_garage: false,
    property_features: ['Basement'],
    property_accessibility: '-',
    property_eco_features: '-',
    property_has_view: false,
    local_amenities: 'close to shopping',
    transport_access: 'excellent bus connectivity',
    ambiance: 'upcoming district',
    latitude: 47.532273,
    longitude: -122.342249,
    img_weather: 'afternoon',
    listing_title: 'Modern Townhouse Perfect for Urban Living',
    listing_description:
      'This 1404 sq ft, 1-bedroom, 3-bathroom modern townhouse offers a sophisticated exterior of grey Douglas Fir wood and concrete.',
    img_prompt_front:
      '4k photo of a modern Townhouse built in 2013 clad in grey Douglas Fir Wood and Concrete, in the Seattle area, taken from street level, natural afternoon lighting, 35mm lens. The image style should be realistic and high quality, similar to professional real estate photography. Additional building info: Modern Townhouse Perfect for Urban Living',
    img_prompt_back:
      '4k photo of the garden of a modern Townhouse built in 2013 clad in grey Douglas Fir Wood and Concrete, in the Seattle area, taken from building backside, natural afternoon lighting, 35mm lens. The image style should be realistic and high quality, similar to professional real estate photography. Additional building info: Modern Townhouse Perfect for Urban Living',
    img_prompt_bedroom:
      "4k photo of a bedroom in a modern Townhouse built in 2013, in the Seattle area, natural afternoon lighting, 35mm lens. The image style should be realistic and high quality, similar to professional real estate photography. Additional room info: , with bamboo flooring, brick walls, and plush comforter with tree motif. The window is dressed with minimal coverings and illuminated by table lamp with wooden base. Decorations include local art prints and it's furnished with a modern wood bed frame.",
  },
  images: ['/real-estate-back.jpg', '/real-estate-front.jpg', '/real-estate-bedroom.jpg'],
}

type RealEstateListing = typeof realEstateListing

type RealEstateListingDetails = typeof realEstateListing.details
