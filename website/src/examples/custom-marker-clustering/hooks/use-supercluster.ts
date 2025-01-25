import { FeatureCollection, GeoJsonProperties, Point } from 'geojson'
import { Accessor, createEffect, createMemo, createSignal } from 'solid-js'
import Supercluster, { ClusterProperties } from 'supercluster'

export function useSupercluster<T extends GeoJsonProperties>(
  geojson: Accessor<FeatureCollection<Point, T> | null>,
  bounds: Accessor<[number, number, number, number]>,
  zoom: Accessor<number>,
  superclusterOptions: Accessor<Supercluster.Options<T, ClusterProperties>>,
) {
  // create the clusterer and keep it
  const clusterer = createMemo(() => {
    return new Supercluster(superclusterOptions())
  })

  // version-number for the data loaded into the clusterer
  // (this is needed to trigger updating the clusters when data was changed)
  const [version, setVersion] = createSignal(0)
  const dataWasUpdated = () => setVersion((v) => v + 1)

  // when data changes, load it into the clusterer
  createEffect(() => {
    if (!geojson()) return

    clusterer().load(geojson()!.features)
    dataWasUpdated()
  })

  // retrieve the clusters within the current viewport
  const clusters = createMemo(() => {
    // don't try to read clusters before data was loaded into the clusterer (version===0),
    // otherwise getClusters will crash
    if (version() === 0) return []

    return clusterer().getClusters(bounds(), zoom())
  })

  // create callbacks to expose supercluster functionality outside of this hook
  const getChildren = (clusterId: number) => clusterer().getChildren(clusterId)

  // note: here, the paging that would be possible is disabled; we found this
  // has no significant performance impact when it's just used in a click event handler.
  const getLeaves = (clusterId: number) => clusterer().getLeaves(clusterId, Infinity)

  const getClusterExpansionZoom = (clusterId: number) => clusterer().getClusterExpansionZoom(clusterId)

  return {
    clusters,
    getChildren,
    getLeaves,
    getClusterExpansionZoom,
  }
}
