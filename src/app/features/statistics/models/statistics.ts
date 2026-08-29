import type { components } from '../../../core/api/generated/api-contracts';

type ApiSchemas = components['schemas'];

export type StatisticsStatus = ApiSchemas['WatchStatus'];
export type StatisticsTotals = ApiSchemas['StatisticsTotals'];
export type StatisticsRatingBucket = ApiSchemas['StatisticsRatingBucket'];
export type StatisticsGenreBucket = ApiSchemas['StatisticsGenreBucket'];
export type StatisticsCountryBucket = ApiSchemas['StatisticsCountryBucket'];
export type StatisticsMonthBucket = ApiSchemas['StatisticsMonthBucket'];
export type StatisticsOverview = ApiSchemas['StatisticsOverviewResponse'];
