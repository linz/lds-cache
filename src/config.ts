import { fsa } from '@chunkd/fs';

import { KxApi } from './kx.ts';

const apiKey = process.env['KX_API_KEY'];
const cachePrefix = process.env['CACHE_PREFIX'] ?? '';
if (apiKey == null) throw new Error('Missing $KX_API_KEY');
if (cachePrefix == null) throw new Error('Missing $CACHE_PREFIX');

export const kx = new KxApi(apiKey);
/** prefix for where to store the cache, @example `s3://bucketName/prefix` */
export const CachePrefix = fsa.toUrl(cachePrefix);
/** List of Kx datasetIds to monitor and import */

export const ExportLayerId = Number(process.env['KX_LAYER_ID'] ?? '0');
/** Single Layer Id to export */

const Monitor = [
  { id: 101290, name: '101290-nz-building-outlines' },
  { id: 103476, name: '103476-nz-trig-points-topo-150k' },
  { id: 103631, name: '103631-nz-river-name-polygons-pilot' },
  { id: 103632, name: '103632-nz-river-name-lines-pilot' },
  { id: 104687, name: '104687-nz-150k-tile-index' },
  { id: 104690, name: '104690-nz-110k-tile-index' },
  { id: 104691, name: '104691-nz-15k-tile-index' },
  { id: 104692, name: '104692-nz-11k-tile-index' },
  { id: 106965, name: '106965-nz-1500-tile-index' },
  { id: 106966, name: '106966-nz-12k-tile-index' },
  { id: 105689, name: '105689-nz-addresses-pilot' },
  { id: 50063, name: '50063-nz-chatham-island-airport-polygons-topo-150k' },
  { id: 50064, name: '50064-nz-chatham-island-beacon-points-topo-150k' },
  { id: 50065, name: '50065-nz-chatham-island-boatramp-centrelines-topo-150k' },
  { id: 50066, name: '50066-nz-chatham-island-breakwater-centrelines-topo-150k' },
  { id: 50067, name: '50067-nz-chatham-island-bridge-centrelines-topo-150k' },
  { id: 50071, name: '50071-nz-chatham-island-cemetery-polygons-topo-150k' },
  { id: 50072, name: '50072-nz-chatham-island-contours-topo-150k' },
  { id: 50073, name: '50073-nz-chatham-island-cemetery-points-topo-150k' },
  { id: 50074, name: '50074-nz-chatham-island-cliff-edges-topo-150k' },
  { id: 50075, name: '50075-nz-chatham-island-dam-centrelines-topo-150k' },
  { id: 50077, name: '50077-nz-chatham-island-drain-centrelines-topo-150k' },
  { id: 50078, name: '50078-nz-chatham-island-exotic-polygons-topo-150k' },
  { id: 50079, name: '50079-nz-chatham-island-fence-centrelines-topo-150k' },
  { id: 50080, name: '50080-nz-chatham-island-ford-points-topo-150k' },
  { id: 50081, name: '50081-nz-chatham-island-gate-points-topo-150k' },
  { id: 50083, name: '50083-nz-chatham-island-golf-course-polygons-topo-150k' },
  { id: 50084, name: '50084-nz-chatham-island-grave-points-topo-150k' },
  { id: 50085, name: '50085-nz-chatham-island-height-points-topo-150k' },
  { id: 50087, name: '50087-nz-chatham-island-lagoon-polygons-topo-150k' },
  { id: 50088, name: '50088-nz-chatham-island-lake-polygons-topo-150k' },
  { id: 50090, name: '50090-nz-chatham-island-mast-points-topo-150k' },
  { id: 50091, name: '50091-nz-chatham-island-monument-points-topo-150k' },
  { id: 50092, name: '50092-nz-chatham-island-mud-polygons-topo-150k' },
  { id: 50093, name: '50093-nz-chatham-island-native-polygons-topo-150k' },
  { id: 50094, name: '50094-nz-chatham-island-reef-polygons-topo-150k' },
  { id: 50095, name: '50095-nz-chatham-island-racetrack-centrelines-topo-150k' },
  { id: 50096, name: '50096-nz-chatham-island-powerline-centrelines-topo-150k' },
  { id: 50097, name: '50097-nz-chatham-island-quarry-polygons-topo-150k' },
  { id: 50098, name: '50098-nz-chatham-island-river-centrelines-topo-150k' },
  { id: 50099, name: '50099-nz-chatham-island-river-polygons-topo-150k' },
  { id: 50100, name: '50100-nz-chatham-island-road-centrelines-topo-150k' },
  { id: 50101, name: '50101-nz-chatham-island-rock-points-topo-150k' },
  { id: 50102, name: '50102-nz-chatham-island-rock-polygons-topo-150k' },
  { id: 50103, name: '50103-nz-chatham-island-runway-polygons-topo-150k' },
  { id: 50104, name: '50104-nz-chatham-island-sand-polygons-topo-150k' },
  { id: 50106, name: '50106-nz-chatham-island-scattered-scrub-polygons-topo-150k' },
  { id: 50107, name: '50107-nz-chatham-island-scrub-polygons-topo-150k' },
  { id: 50108, name: '50108-nz-chatham-island-shelter-belt-centrelines-topo-150k' },
  { id: 50109, name: '50109-nz-chatham-island-shingle-polygons-topo-150k' },
  { id: 50110, name: '50110-nz-chatham-island-soakhole-points-topo-150k' },
  { id: 50111, name: '50111-nz-chatham-island-stockyard-points-topo-150k' },
  { id: 50112, name: '50112-nz-chatham-island-swamp-points-topo-150k' },
  { id: 50113, name: '50113-nz-chatham-island-swamp-polygons-topo-150k' },
  { id: 50114, name: '50114-nz-chatham-island-tank-points-topo-150k' },
  { id: 50115, name: '50115-nz-chatham-island-track-centrelines-topo-150k' },
  { id: 50116, name: '50116-nz-chatham-island-tree-points-topo-150k' },
  { id: 50117, name: '50117-nz-chatham-island-wharf-centrelines-topo-150k' },
  { id: 50118, name: '50118-nz-chatham-island-wreck-points-topo-150k' },
  { id: 50180, name: '50180-nz-railway-centrelines-topo-1250k' },
  { id: 50184, name: '50184-nz-road-centrelines-topo-1250k' },
  { id: 50237, name: '50237-nz-airport-polygons-topo-150k' },
  { id: 50238, name: '50238-nz-beacon-points-topo-150k' },
  { id: 50239, name: '50239-nz-bivouac-points-topo-150k' },
  { id: 50241, name: '50241-nz-boatramp-centrelines-topo-150k' },
  { id: 50242, name: '50242-nz-boom-centrelines-topo-150k' },
  { id: 50243, name: '50243-nz-breakwater-centrelines-topo-150k' },
  { id: 50244, name: '50244-nz-bridge-centrelines-topo-150k' },
  { id: 50245, name: '50245-nz-building-points-topo-150k' },
  { id: 50246, name: '50246-nz-building-polygons-topo-150k' },
  { id: 50247, name: '50247-nz-buoy-points-topo-150k' },
  { id: 50248, name: '50248-nz-cableway-industrial-centrelines-topo-150k' },
  { id: 50249, name: '50249-nz-cableway-people-centrelines-topo-150k' },
  { id: 50253, name: '50253-nz-cave-points-topo-150k' },
  { id: 50254, name: '50254-nz-cemetery-points-topo-150k' },
  { id: 50255, name: '50255-nz-cemetery-polygons-topo-150k' },
  { id: 50256, name: '50256-nz-chimney-points-topo-150k' },
  { id: 50257, name: '50257-nz-cliff-edges-topo-150k' },
  { id: 50259, name: '50259-nz-cutting-edges-topo-150k' },
  { id: 50260, name: '50260-nz-dam-centrelines-topo-150k' },
  { id: 50263, name: '50263-nz-dredge-points-topo-150k' },
  { id: 50264, name: '50264-nz-dredge-tailing-centrelines-topo-150k' },
  { id: 50265, name: '50265-nz-dry-dock-polygons-topo-150k' },
  { id: 50266, name: '50266-nz-embankment-centrelines-topo-150k' },
  { id: 50267, name: '50267-nz-exotic-polygons-topo-150k' },
  { id: 50268, name: '50268-nz-fence-centrelines-topo-150k' },
  { id: 50269, name: '50269-nz-ferry-crossing-centrelines-topo-150k' },
  { id: 50270, name: '50270-nz-fish-farm-polygons-topo-150k' },
  { id: 50271, name: '50271-nz-flare-points-topo-150k' },
  { id: 50272, name: '50272-nz-floodgate-points-topo-150k' },
  { id: 50273, name: '50273-nz-flume-centrelines-topo-150k' },
  { id: 50275, name: '50275-nz-ford-points-topo-150k' },
  { id: 50276, name: '50276-nz-fumarole-points-topo-150k' },
  { id: 50277, name: '50277-nz-gas-valve-points-topo-150k' },
  { id: 50278, name: '50278-nz-gate-points-topo-150k' },
  { id: 50279, name: '50279-nz-geo-bore-points-topo-150k' },
  { id: 50281, name: '50281-nz-golf-course-polygons-topo-150k' },
  { id: 50282, name: '50282-nz-grave-points-topo-150k' },
  { id: 50283, name: '50283-nz-gravel-pit-polygons-topo-150k' },
  { id: 50284, name: '50284-nz-height-points-topo-150k' },
  { id: 50285, name: '50285-nz-helipad-points-topo-150k' },
  { id: 50286, name: '50286-nz-historic-site-points-topo-150k' },
  { id: 50287, name: '50287-nz-ice-polygons-topo-150k' },
  { id: 50290, name: '50290-nz-ladder-centrelines-topo-150k' },
  { id: 50291, name: '50291-nz-ladder-points-topo-150k' },
  { id: 50292, name: '50292-nz-lagoon-polygons-topo-150k' },
  { id: 50293, name: '50293-nz-lake-polygons-topo-150k' },
  { id: 50294, name: '50294-nz-landfill-polygons-topo-150k' },
  { id: 50295, name: '50295-nz-linz-map-sheets-topo-150k' },
  { id: 50296, name: '50296-nz-mangrove-polygons-topo-150k' },
  { id: 50297, name: '50297-nz-marine-farm-centrelines-topo-150k' },
  { id: 50298, name: '50298-nz-marine-farm-polygons-topo-150k' },
  { id: 50299, name: '50299-nz-mast-points-topo-150k' },
  { id: 50300, name: '50300-nz-mine-points-topo-150k' },
  { id: 50301, name: '50301-nz-mine-polygons-topo-150k' },
  { id: 50302, name: '50302-nz-monument-points-topo-150k' },
  { id: 50303, name: '50303-nz-moraine-polygons-topo-150k' },
  { id: 50304, name: '50304-nz-moraine-wall-polygons-topo-150k' },
  { id: 50305, name: '50305-nz-mud-polygons-topo-150k' },
  { id: 50306, name: '50306-nz-native-polygons-topo-150k' },
  { id: 50307, name: '50307-nz-orchard-polygons-topo-150k' },
  { id: 50308, name: '50308-nz-pa-points-topo-150k' },
  { id: 50309, name: '50309-nz-pipeline-centrelines-topo-150k' },
  { id: 50310, name: '50310-nz-pond-polygons-topo-150k' },
  { id: 50311, name: '50311-nz-powerline-centrelines-topo-150k' },
  { id: 50312, name: '50312-nz-pumice-pit-polygons-topo-150k' },
  { id: 50313, name: '50313-nz-pylon-points-topo-150k' },
  { id: 50314, name: '50314-nz-quarry-polygons-topo-150k' },
  { id: 50315, name: '50315-nz-racetrack-centrelines-topo-150k' },
  { id: 50316, name: '50316-nz-racetrack-polygons-topo-150k' },
  { id: 50317, name: '50317-nz-radar-dome-points-topo-150k' },
  { id: 50318, name: '50318-nz-rail-station-points-topo-150k' },
  { id: 50319, name: '50319-nz-railway-centrelines-topo-150k' },
  { id: 50320, name: '50320-nz-rapid-centrelines-topo-150k' },
  { id: 50321, name: '50321-nz-rapid-polygons-topo-150k' },
  { id: 50322, name: '50322-nz-redoubt-points-topo-150k' },
  { id: 50323, name: '50323-nz-reef-polygons-topo-150k' },
  { id: 50325, name: '50325-nz-residential-area-polygons-topo-150k' },
  { id: 50326, name: '50326-nz-rifle-range-polygons-topo-150k' },
  { id: 50329, name: '50329-nz-road-centrelines-topo-150k' },
  { id: 50330, name: '50330-nz-rock-outcrop-points-topo-150k' },
  { id: 50331, name: '50331-nz-rock-points-topo-150k' },
  { id: 50332, name: '50332-nz-rock-polygons-topo-150k' },
  { id: 50333, name: '50333-nz-runway-polygons-topo-150k' },
  { id: 50335, name: '50335-nz-sand-polygons-topo-150k' },
  { id: 50336, name: '50336-nz-satellite-station-points-topo-150k' },
  { id: 50337, name: '50337-nz-scattered-scrub-polygons-topo-150k' },
  { id: 50338, name: '50338-nz-scree-polygons-topo-150k' },
  { id: 50339, name: '50339-nz-scrub-polygons-topo-150k' },
  { id: 50340, name: '50340-nz-shaft-points-topo-150k' },
  { id: 50341, name: '50341-nz-shelter-belt-centrelines-topo-150k' },
  { id: 50342, name: '50342-nz-shingle-polygons-topo-150k' },
  { id: 50343, name: '50343-nz-shoal-polygons-topo-150k' },
  { id: 50344, name: '50344-nz-showground-polygons-topo-150k' },
  { id: 50345, name: '50345-nz-sinkhole-points-topo-150k' },
  { id: 50346, name: '50346-nz-siphon-points-topo-150k' },
  { id: 50347, name: '50347-nz-siphon-polygons-topo-150k' },
  { id: 50348, name: '50348-nz-ski-lift-centrelines-topo-150k' },
  { id: 50349, name: '50349-nz-ski-tow-centrelines-topo-150k' },
  { id: 50350, name: '50350-nz-slip-edges-topo-150k' },
  { id: 50351, name: '50351-nz-slipway-centrelines-topo-150k' },
  { id: 50353, name: '50353-nz-soakhole-points-topo-150k' },
  { id: 50355, name: '50355-nz-sportsfield-polygons-topo-150k' },
  { id: 50356, name: '50356-nz-spring-points-topo-150k' },
  { id: 50357, name: '50357-nz-stockyard-points-topo-150k' },
  { id: 50358, name: '50358-nz-swamp-points-topo-150k' },
  { id: 50359, name: '50359-nz-swamp-polygons-topo-150k' },
  { id: 50360, name: '50360-nz-tank-points-topo-150k' },
  { id: 50361, name: '50361-nz-tank-polygons-topo-150k' },
  { id: 50362, name: '50362-nz-telephone-centrelines-topo-150k' },
  { id: 50363, name: '50363-nz-tower-points-topo-150k' },
  { id: 50364, name: '50364-nz-track-centrelines-topo-150k' },
  { id: 50366, name: '50366-nz-tunnel-centrelines-topo-150k' },
  { id: 50367, name: '50367-nz-vineyard-polygons-topo-150k' },
  { id: 50368, name: '50368-nz-walkwire-centrelines-topo-150k' },
  { id: 50369, name: '50369-nz-water-race-centrelines-topo-150k' },
  { id: 50370, name: '50370-nz-waterfall-centrelines-topo-150k' },
  { id: 50371, name: '50371-nz-waterfall-edges-topo-150k' },
  { id: 50372, name: '50372-nz-waterfall-points-topo-150k' },
  { id: 50373, name: '50373-nz-waterfall-polygons-topo-150k' },
  { id: 50375, name: '50375-nz-well-points-topo-150k' },
  { id: 50376, name: '50376-nz-wharf-centrelines-topo-150k' },
  { id: 50377, name: '50377-nz-wharf-edges-topo-150k' },
  { id: 50378, name: '50378-nz-windmill-points-topo-150k' },
  { id: 50379, name: '50379-nz-wreck-points-topo-150k' },
  { id: 50768, name: '50768-nz-contours-topo-150k' },
  { id: 50772, name: '50772-nz-primary-parcels' },
  { id: 50888, name: '50888-nz-snares-island-tini-heke-contours-topo-125k' },
  { id: 50889, name: '50889-nz-snares-island-tini-heke-cliff-edges-topo-125k' },
  { id: 50892, name: '50892-nz-snares-island-tini-heke-height-points-topo-125k' },
  { id: 50893, name: '50893-nz-snares-island-tini-heke-island-polygons-topo-125k' },
  { id: 50894, name: '50894-nz-snares-island-tini-heke-lake-polygons-topo-125k' },
  { id: 50895, name: '50895-nz-snares-island-tini-heke-native-polygons-topo-125k' },
  { id: 50896, name: '50896-nz-snares-island-tini-heke-river-centrelines-topo-125k' },
  { id: 50897, name: '50897-nz-snares-island-tini-heke-rock-polygons-topo-125k' },
  { id: 50898, name: '50898-nz-snares-island-tini-heke-scrub-polygons-topo-125k' },
  { id: 50902, name: '50902-nz-kermadec-is-cableway-people-centrelines-topo-125k' },
  { id: 50903, name: '50903-nz-kermadec-is-cliff-edges-topo-125k' },
  { id: 50904, name: '50904-nz-kermadec-is-contours-topo-125k' },
  { id: 50907, name: '50907-nz-kermadec-is-height-points-topo-125k' },
  { id: 50908, name: '50908-nz-kermadec-is-island-polygons-topo-125k' },
  { id: 50909, name: '50909-nz-kermadec-is-lake-polygons-topo-125k' },
  { id: 50910, name: '50910-nz-kermadec-is-native-polygons-topo-125k' },
  { id: 50911, name: '50911-nz-kermadec-is-river-centrelines-topo-125k' },
  { id: 50912, name: '50912-nz-kermadec-is-rock-points-topo-125k' },
  { id: 50913, name: '50913-nz-kermadec-is-rock-polygons-topo-125k' },
  { id: 50914, name: '50914-nz-kermadec-is-runway-polygons-topo-125k' },
  { id: 50915, name: '50915-nz-kermadec-is-sand-polygons-topo-125k' },
  { id: 50916, name: '50916-nz-kermadec-is-scrub-polygons-topo-125k' },
  { id: 50917, name: '50917-nz-kermadec-is-shoal-polygons-topo-125k' },
  { id: 50918, name: '50918-nz-kermadec-is-soakhole-points-topo-125k' },
  { id: 50919, name: '50919-nz-kermadec-is-spring-points-topo-125k' },
  { id: 50920, name: '50920-nz-kermadec-is-swamp-polygons-topo-125k' },
  { id: 50921, name: '50921-nz-kermadec-is-track-centrelines-topo-125k' },
  { id: 50923, name: '50923-nz-kermadec-is-wreck-points-topo-125k' },
  { id: 50926, name: '50926-nz-campbell-island-motu-ihupuku-cliff-edges-topo-150k' },
  { id: 50927, name: '50927-nz-campbell-island-motu-ihupuku-contours-topo-150k' },
  { id: 50930, name: '50930-nz-campbell-island-motu-ihupuku-height-points-topo-150k' },
  { id: 50932, name: '50932-nz-campbell-island-motu-ihupuku-island-polygons-topo-150k' },
  { id: 50933, name: '50933-nz-campbell-island-motu-ihupuku-lake-polygons-topo-150k' },
  { id: 50934, name: '50934-nz-campbell-island-motu-ihupuku-river-centrelines-topo-150k' },
  { id: 50935, name: '50935-nz-campbell-island-motu-ihupuku-rock-outcrop-points-topo-150k' },
  { id: 50936, name: '50936-nz-campbell-island-motu-ihupuku-rock-polygons-topo-150k' },
  { id: 50937, name: '50937-nz-campbell-island-motu-ihupuku-sand-polygons-topo-150k' },
  { id: 50938, name: '50938-nz-campbell-island-motu-ihupuku-scrub-polygons-topo-150k' },
  { id: 50939, name: '50939-nz-campbell-island-motu-ihupuku-shoal-polygons-topo-150k' },
  { id: 50940, name: '50940-nz-campbell-island-motu-ihupuku-soakhole-points-topo-150k' },
  { id: 50941, name: '50941-nz-campbell-island-motu-ihupuku-track-centrelines-topo-150k' },
  { id: 50942, name: '50942-nz-campbell-island-motu-ihupuku-waterfall-points-topo-150k' },
  { id: 50952, name: '50952-nz-auckland-island-cemetery-points-topo-150k' },
  { id: 50953, name: '50953-nz-auckland-island-cliff-edges-topo-150k' },
  { id: 50954, name: '50954-nz-auckland-island-contours-topo-150k' },
  { id: 50957, name: '50957-nz-auckland-island-height-points-topo-150k' },
  { id: 50959, name: '50959-nz-auckland-island-island-polygons-topo-150k' },
  { id: 50960, name: '50960-nz-auckland-island-lake-polygons-topo-150k' },
  { id: 50961, name: '50961-nz-auckland-island-native-polygons-topo-150k' },
  { id: 50962, name: '50962-nz-auckland-island-river-centrelines-topo-150k' },
  { id: 50963, name: '50963-nz-auckland-island-rock-outcrop-points-topo-150k' },
  { id: 50964, name: '50964-nz-auckland-island-rock-points-topo-150k' },
  { id: 50965, name: '50965-nz-auckland-island-rock-polygons-topo-150k' },
  { id: 50966, name: '50966-nz-auckland-island-sand-polygons-topo-150k' },
  { id: 50967, name: '50967-nz-auckland-island-swamp-points-topo-150k' },
  { id: 50968, name: '50968-nz-auckland-island-swamp-polygons-topo-150k' },
  { id: 50969, name: '50969-nz-auckland-island-track-centrelines-topo-150k' },
  { id: 50970, name: '50970-nz-auckland-island-waterfall-points-topo-150k' },
  { id: 50971, name: '50971-nz-auckland-island-wreck-points-topo-150k' },
  { id: 50973, name: '50973-nz-antipodes-island-cliff-edges-topo-125k' },
  { id: 50974, name: '50974-nz-antipodes-island-contours-topo-125k' },
  { id: 50977, name: '50977-nz-antipodes-island-height-points-topo-125k' },
  { id: 50978, name: '50978-nz-antipodes-island-polygons-topo-125k' },
  { id: 50979, name: '50979-nz-antipodes-island-river-centrelines-topo-125k' },
  { id: 50980, name: '50980-nz-antipodes-island-rock-outcrop-points-topo-125k' },
  { id: 50981, name: '50981-nz-antipodes-island-rock-points-topo-125k' },
  { id: 50982, name: '50982-nz-antipodes-island-rock-polygons-topo-125k' },
  { id: 50983, name: '50983-nz-antipodes-island-sand-polygons-topo-125k' },
  { id: 50984, name: '50984-nz-antipodes-island-shingle-polygons-topo-125k' },
  { id: 50985, name: '50985-nz-antipodes-island-sinkhole-points-topo-125k' },
  { id: 50986, name: '50986-nz-antipodes-island-swamp-polygons-topo-125k' },
  { id: 50987, name: '50987-nz-antipodes-island-waterfall-points-topo-125k' },
  { id: 50988, name: '50988-nz-bounty-islands-cliff-edges-topo-125k' },
  { id: 50989, name: '50989-nz-bounty-islands-contours-topo-125k' },
  { id: 50991, name: '50991-nz-bounty-islands-height-points-topo-125k' },
  { id: 50992, name: '50992-nz-bounty-islands-polygons-topo-125k' },
  { id: 50993, name: '50993-nz-bounty-islands-rock-points-topo-125k' },
  { id: 50994, name: '50994-nz-bounty-islands-rock-polygons-topo-125k' },
  { id: 51000, name: '51000-historic-aerial-photos-survey-footprints-crown-1936-2005' },
  { id: 51002, name: '51002-nz-aerial-photo-footprints-mainland-nz-1936-2005-polygons' },
  { id: 51153, name: '51153-nz-coastlines-and-islands-polygons-topo-150k' },
  { id: 51154, name: '51154-nzgb-gazetteer-application-labels-wfs-layer' },
  { id: 52141, name: '52141-tokelau-breakwater-centrelines-topo-125k' },
  { id: 52143, name: '52143-tokelau-bridge-centrelines-topo-125k' },
  { id: 52146, name: '52146-tokelau-cemetery-points-topo-125k' },
  { id: 52149, name: '52149-tokelau-island-polygons-topo-125k' },
  { id: 52150, name: '52150-tokelau-lagoon-polygons-topo-125k' },
  { id: 52151, name: '52151-tokelau-landfill-polygons-topo-125k' },
  { id: 52152, name: '52152-tokelau-mast-points-topo-125k' },
  { id: 52153, name: '52153-tokelau-monument-points-topo-125k' },
  { id: 52154, name: '52154-tokelau-native-polygons-topo-125k' },
  { id: 52155, name: '52155-tokelau-reef-polygons-topo-125k' },
  { id: 52156, name: '52156-tokelau-residential-area-polygons-topo-125k' },
  { id: 52157, name: '52157-tokelau-road-centrelines-topo-125k' },
  { id: 52158, name: '52158-tokelau-rock-points-topo-125k' },
  { id: 52159, name: '52159-tokelau-sand-polygons-topo-125k' },
  { id: 52160, name: '52160-tokelau-scrub-polygons-topo-125k' },
  { id: 52161, name: '52161-tokelau-shoal-polygons-topo-125k' },
  { id: 52162, name: '52162-tokelau-track-centrelines-topo-125k' },
  { id: 52163, name: '52163-tokelau-tree-points-topo-125k' },
  { id: 52164, name: '52164-tokelau-well-points-topo-125k' },
  { id: 52165, name: '52165-tokelau-wharf-centrelines-topo-125k' },
  { id: 52166, name: '52166-tokelau-wharf-edges-topo-125k' },
  { id: 52168, name: '52168-niue-airport-polygons-topo-150k' },
  { id: 52169, name: '52169-niue-boatramp-centrelines-topo-150k' },
  { id: 52172, name: '52172-niue-cave-points-topo-150k' },
  { id: 52173, name: '52173-niue-contours-topo-150k' },
  { id: 52175, name: '52175-niue-fence-centrelines-topo-150k' },
  { id: 52178, name: '52178-niue-grave-points-topo-150k' },
  { id: 52179, name: '52179-niue-golf-course-polygons-topo-150k' },
  { id: 52181, name: '52181-niue-island-polygons-topo-150k' },
  { id: 52182, name: '52182-niue-landfill-polygons-topo-150k' },
  { id: 52183, name: '52183-niue-mast-points-topo-150k' },
  { id: 52184, name: '52184-niue-native-polygons-topo-150k' },
  { id: 52185, name: '52185-niue-orchard-polygons-topo-150k' },
  { id: 52186, name: '52186-niue-quarry-polygons-topo-150k' },
  { id: 52187, name: '52187-niue-reef-polygons-topo-150k' },
  { id: 52188, name: '52188-niue-road-centrelines-topo-150k' },
  { id: 52189, name: '52189-niue-rock-points-topo-150k' },
  { id: 52190, name: '52190-niue-runway-polygons-topo-150k' },
  { id: 52191, name: '52191-niue-scrub-polygons-topo-150k' },
  { id: 52192, name: '52192-niue-shelter-belt-centrelines-topo-150k' },
  { id: 52193, name: '52193-niue-tank-points-topo-150k' },
  { id: 52194, name: '52194-niue-track-centrelines-topo-150k' },
  { id: 52195, name: '52195-niue-tree-points-topo-150k' },
  { id: 52196, name: '52196-niue-well-points-topo-150k' },
  { id: 52197, name: '52197-niue-wharf-edges-topo-150k' },
  { id: 52198, name: '52198-niue-wreck-points-topo-150k' },
  { id: 52203, name: '52203-cook-islands-island-polygons-topo-150k-zone4' },
  { id: 52205, name: '52205-cook-islands-lagoon-polygons-topo-150k-zone4' },
  { id: 52206, name: '52206-cook-islands-native-polygons-topo-150k-zone4' },
  { id: 52207, name: '52207-cook-islands-reef-polygons-topo-150k-zone4' },
  { id: 52208, name: '52208-cook-islands-river-centrelines-topo-150k-zone4' },
  { id: 52209, name: '52209-cook-islands-road-centrelines-topo-150k-zone4' },
  { id: 52210, name: '52210-cook-islands-rock-points-topo-150k-zone4' },
  { id: 52211, name: '52211-cook-islands-runway-polygons-topo-150k-zone4' },
  { id: 52212, name: '52212-cook-islands-sand-polygons-topo-150k-zone4' },
  { id: 52213, name: '52213-cook-islands-scrub-polygons-topo-150k-zone4' },
  { id: 52214, name: '52214-cook-islands-shoal-polygons-topo-150k-zone4' },
  { id: 52215, name: '52215-cook-islands-track-centrelines-topo-150k-zone4' },
  { id: 52216, name: '52216-cook-islands-tree-points-topo-150k-zone4' },
  { id: 52218, name: '52218-cook-islands-beacon-points-topo-150k-zone3' },
  { id: 52222, name: '52222-cook-islands-island-polygons-topo-150k-zone3' },
  { id: 52223, name: '52223-cook-islands-lagoon-polygons-topo-150k-zone3' },
  { id: 52224, name: '52224-cook-islands-native-polygons-topo-150k-zone3' },
  { id: 52225, name: '52225-cook-islands-reef-polygons-topo-150k-zone3' },
  { id: 52226, name: '52226-cook-islands-sand-polygons-topo-150k-zone3' },
  { id: 52227, name: '52227-cook-islands-scrub-polygons-topo-150k-zone3' },
  { id: 52228, name: '52228-cook-islands-shoal-polygons-topo-150k-zone3' },
  { id: 52229, name: '52229-cook-islands-tree-points-topo-150k-zone3' },
  { id: 52231, name: '52231-cook-islands-airport-polygons-topo-125k-zone4' },
  { id: 52232, name: '52232-cook-islands-beacon-points-topo-125k-zone4' },
  { id: 52233, name: '52233-cook-islands-boatramp-centrelines-topo-125k-zone4' },
  { id: 52234, name: '52234-cook-islands-breakwater-centrelines-topo-125k-zone4' },
  { id: 52235, name: '52235-cook-islands-bridge-centrelines-topo-125k-zone4' },
  { id: 52238, name: '52238-cook-islands-cave-points-topo-125k-zone4' },
  { id: 52239, name: '52239-cook-islands-cemetery-points-topo-125k-zone4' },
  { id: 52240, name: '52240-cook-islands-cemetery-polygons-topo-125k-zone4' },
  { id: 52241, name: '52241-cook-islands-cliff-edges-topo-125k-zone4' },
  { id: 52242, name: '52242-cook-islands-contours-topo-125k-zone4' },
  { id: 52244, name: '52244-cook-islands-drain-centrelines-topo-125k-zone4' },
  { id: 52245, name: '52245-cook-islands-embankment-centrelines-topo-125k-zone4' },
  { id: 52246, name: '52246-cook-islands-fence-centrelines-topo-125k-zone4' },
  { id: 52248, name: '52248-cook-islands-golf-course-polygons-topo-125k-zone4' },
  { id: 52249, name: '52249-cook-islands-height-points-topo-125k-zone4' },
  { id: 52251, name: '52251-cook-islands-island-polygons-topo-125k-zone4' },
  { id: 52252, name: '52252-cook-islands-lagoon-polygons-topo-125k-zone4' },
  { id: 52253, name: '52253-cook-islands-lake-polygons-topo-125k-zone4' },
  { id: 52254, name: '52254-cook-islands-landfill-polygons-topo-125k-zone4' },
  { id: 52255, name: '52255-cook-islands-mast-points-topo-125k-zone4' },
  { id: 52256, name: '52256-cook-islands-monument-points-topo-125k-zone4' },
  { id: 52257, name: '52257-cook-islands-native-polygons-topo-125k-zone4' },
  { id: 52258, name: '52258-cook-islands-orchard-polygons-topo-125k-zone4' },
  { id: 52259, name: '52259-cook-islands-pond-polygons-topo-125k-zone4' },
  { id: 52260, name: '52260-cook-islands-quarry-polygons-topo-125k-zone4' },
  { id: 52261, name: '52261-cook-islands-reef-polygons-topo-125k-zone4' },
  { id: 52262, name: '52262-cook-islands-reservoir-polygons-topo-125k-zone4' },
  { id: 52263, name: '52263-cook-islands-residential-area-polygons-topo-125k-zone4' },
  { id: 52264, name: '52264-cook-islands-river-centrelines-topo-125k-zone4' },
  { id: 52265, name: '52265-cook-islands-river-polygons-topo-125k-zone4' },
  { id: 52266, name: '52266-cook-islands-road-centrelines-topo-125k-zone4' },
  { id: 52267, name: '52267-cook-islands-rock-points-topo-125k-zone4' },
  { id: 52268, name: '52268-cook-islands-runway-polygons-topo-125k-zone4' },
  { id: 52269, name: '52269-cook-islands-sand-polygons-topo-125k-zone4' },
  { id: 52270, name: '52270-cook-islands-scattered-scrub-polygons-topo-125k-zone4' },
  { id: 52271, name: '52271-cook-islands-scrub-polygons-topo-125k-zone4' },
  { id: 52272, name: '52272-cook-islands-shelter-belt-centrelines-topo-125k-zone4' },
  { id: 52273, name: '52273-cook-islands-shoal-polygons-topo-125k-zone4' },
  { id: 52274, name: '52274-cook-islands-sinkhole-points-topo-125k-zone4' },
  { id: 52275, name: '52275-cook-islands-soakhole-points-topo-125k-zone4' },
  { id: 52276, name: '52276-cook-islands-sportsfield-polygons-topo-125k-zone4' },
  { id: 52277, name: '52277-cook-islands-swamp-points-topo-125k-zone4' },
  { id: 52278, name: '52278-cook-islands-swamp-polygons-topo-125k-zone4' },
  { id: 52279, name: '52279-cook-islands-tank-points-topo-125k-zone4' },
  { id: 52280, name: '52280-cook-islands-tank-polygons-topo-125k-zone4' },
  { id: 52281, name: '52281-cook-islands-track-centrelines-topo-125k-zone4' },
  { id: 52282, name: '52282-cook-islands-tree-points-topo-125k-zone4' },
  { id: 52283, name: '52283-cook-islands-waterfall-points-topo-125k-zone4' },
  { id: 52284, name: '52284-cook-islands-wharf-centrelines-topo-125k-zone4' },
  { id: 52285, name: '52285-cook-islands-wharf-edges-topo-125k-zone4' },
  { id: 52289, name: '52289-cook-islands-cemetery-points-topo-125k-zone3' },
  { id: 52291, name: '52291-cook-islands-embankment-centrelines-topo-125k-zone3' },
  { id: 52293, name: '52293-cook-islands-island-polygons-topo-125k-zone3' },
  { id: 52294, name: '52294-cook-islands-kiln-points-topo-125k-zone3' },
  { id: 52295, name: '52295-cook-islands-lagoon-polygons-topo-125k-zone3' },
  { id: 52296, name: '52296-cook-islands-lake-polygons-topo-125k-zone3' },
  { id: 52297, name: '52297-cook-islands-native-polygons-topo-125k-zone3' },
  { id: 52298, name: '52298-cook-islands-reef-polygons-topo-125k-zone3' },
  { id: 52299, name: '52299-cook-islands-river-centrelines-topo-125k-zone3' },
  { id: 52300, name: '52300-cook-islands-road-centrelines-topo-125k-zone3' },
  { id: 52301, name: '52301-cook-islands-rock-points-topo-125k-zone3' },
  { id: 52302, name: '52302-cook-islands-runway-polygons-topo-125k-zone3' },
  { id: 52303, name: '52303-cook-islands-sand-polygons-topo-125k-zone3' },
  { id: 52304, name: '52304-cook-islands-scrub-polygons-topo-125k-zone3' },
  { id: 52305, name: '52305-cook-islands-shoal-polygons-topo-125k-zone3' },
  { id: 52306, name: '52306-cook-islands-swamp-points-topo-125k-zone3' },
  { id: 52307, name: '52307-cook-islands-swamp-polygons-topo-125k-zone3' },
  { id: 52308, name: '52308-cook-islands-track-centrelines-topo-125k-zone3' },
  { id: 52309, name: '52309-cook-islands-tree-points-topo-125k-zone3' },
  { id: 52310, name: '52310-cook-islands-wharf-centrelines-topo-125k-zone3' },
  { id: 52390, name: '52390-nz-campbell-island-motu-ihupuku-rock-points-topo-150k' },
  // TODO: re-enable this when BM-1070 is fixed
  // { id: 53382, name: '53382-nz-roads-addressing' },
];

export const Layers = new Map<number, { id: number; name: string }>();
for (const layer of Monitor) Layers.set(layer.id, layer);
