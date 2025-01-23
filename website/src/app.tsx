import { Meta, MetaProvider, Title } from '@solidjs/meta'
import { Router } from '@solidjs/router'
import { FileRoutes } from '@solidjs/start/router'
import { Suspense } from 'solid-js'
import './styles/globals.scss'

const title = 'SolidJS Google Maps'
const description = 'SolidJS components and hooks for the Google Maps Javascript API'

import '@fontsource/inter'
import '@fontsource-variable/aleo'
import '@fontsource-variable/big-shoulders-text'

import { getCookie } from 'vinxi/http'
import { ColorModeProvider, ColorModeScript, cookieStorageManagerSSR } from '@kobalte/core'
import { isServer } from 'solid-js/web'

function getServerCookies() {
  'use server'
  const colorMode = getCookie('kb-color-mode')
  return colorMode ? `kb-color-mode=${colorMode}` : ''
}

export default function App() {
  const storageManager = cookieStorageManagerSSR(isServer ? getServerCookies() : document.cookie)
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Title>
            {description} - {title}
          </Title>
          <Meta name="description" content={description} />

          <ColorModeScript storageType={storageManager.type} />
          <ColorModeProvider storageManager={storageManager}>
            <main>
              <Suspense>{props.children}</Suspense>
            </main>
          </ColorModeProvider>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  )
}
