import FeedStream from './FeedStream';
import { FluidGrid, OrderedBento } from './GridLayouts';
import SpatialMosaic from './SpatialMosaic';

export const LAYOUTS = {
  bento: OrderedBento,
  fluid: FluidGrid,
  feed: FeedStream,
  mosaic: SpatialMosaic,
};
