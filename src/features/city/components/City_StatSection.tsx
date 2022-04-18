import React from "react";

import useApi from "@hooks/useApi";
import { useParams } from "react-router-dom";
import StatsBoard, {
  StatsBoardSkeleton,
  StatsBoardStat,
} from "@components/StatsBoard";
import CityApi from "@features/city/city-api";
import Section from "@components/Section";
import { useTranslation } from "react-i18next";

export const CityStatSection: React.FC = () => {
  const params = useParams<{ cityId: string }>();

  const { data } = useApi(CityApi.stat(params.cityId));
  const { t } = useTranslation();

  const stats: Array<StatsBoardStat> = [
    {
      label: t("stat.confirmed"),
      color: "red",
      value: data.overview.confirmed[0],
      delta: data.overview.confirmed[1],
    },
    {
      label: t("stat.deceased"),
      color: "grey",
      value: data.overview.deceased[0],
      delta: data.overview.deceased[1],
    },
    {
      label: t("stat.confirmed_cases_per_100k"),
      color: "blue",
      value: data.overview.per100k[0],
      delta: data.overview.per100k[1],
    },
  ];

  return (
    <Section>
      <StatsBoard stats={stats} />
    </Section>
  );
};

export const CityStatSectionSkeleton: React.FC = () => {
  return (
    <Section>
      <StatsBoardSkeleton columns={4} />
    </Section>
  );
};
