// src/components/Tools/KonturTraseJalan/InterpolationResults.tsx
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Calculator } from "lucide-react";
import { cn } from "@/lib/cn";
import { softColors } from "@/lib/utils.client";
import { SegmentData } from "@/lib/utils/kontur";

// ✨ This is the new Prop Type
type NestedInterpolationResults = {
  vertical: Record<string, SegmentData[]>;
  horizontal: Record<string, SegmentData[]>;
};

type InterpolationResultsProps = {
  results: NestedInterpolationResults;
  gridDimension: number;
};

// Helper component for the innermost accordion (the segment detail)
// No changes needed here, it's already perfect for its job.
const SegmentDetailItem = ({
  segment,
  idx,
  gridDimension,
  colorOffset = 0,
}: {
  segment: SegmentData;
  idx: number;
  gridDimension: number;
  colorOffset?: number;
}) => (
  <AccordionItem
    key={`seg-detail-${idx}`}
    value={`seg-detail-${idx}`}
    className={cn(
      "bg-background/30 rounded-md border-l-4 px-4",
      softColors[(idx + colorOffset) % softColors.length],
    )}
  >
    <AccordionTrigger className="font-mono text-sm font-medium no-underline hover:no-underline">
      {`Titik ${segment.elev1.toFixed(2)}m → ${segment.elev2.toFixed(2)}m`}
    </AccordionTrigger>
    <AccordionContent className="pb-0">
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kontur</TableHead>
              <TableHead className="text-right">Jarak dari Awal</TableHead>
              <TableHead className="text-right">Jarak dari Akhir</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {segment.points.map((p) => {
              const distB = gridDimension - p.distance;
              return (
                <TableRow key={p.contourLevel}>
                  <TableCell className="font-mono">
                    {p.contourLevel.toFixed(2)} m
                  </TableCell>
                  <TableCell
                    className="text-right font-mono"
                    dangerouslySetInnerHTML={{
                      __html: `${p.distance.toFixed(2)} cm`,
                    }}
                  />
                  <TableCell
                    className="text-right font-mono"
                    dangerouslySetInnerHTML={{
                      __html: `${distB.toFixed(2)} cm`,
                    }}
                  />
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </AccordionContent>
  </AccordionItem>
);

export function InterpolationResults({
  results,
  gridDimension,
}: InterpolationResultsProps) {
  const hasVerticalResults = Object.keys(results.vertical).length > 0;
  const hasHorizontalResults = Object.keys(results.horizontal).length > 0;

  if (!hasVerticalResults && !hasHorizontalResults) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="text-primary h-5 w-5" />
          Detail Titik Interval Kontur per Segmen
        </CardTitle>
        <CardDescription>
          Klik untuk melihat detail perhitungan pada setiap baris atau kolom
          grid.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Main Accordion for Vertical vs Horizontal */}
        <Accordion
          type="multiple"
          className="w-full space-y-4"
          defaultValue={["segmen-vertikal"]}
        >
          {/* --- VERTICAL SEGMENTS --- */}
          {hasVerticalResults && (
            <AccordionItem value="segmen-vertikal">
              <AccordionTrigger className="text-lg font-semibold">
                ⇕ Segmen Vertikal
              </AccordionTrigger>
              <AccordionContent>
                {/* Level 2 Accordion: Group by Column */}
                <Accordion type="multiple" className="space-y-3">
                  {Object.entries(results.vertical).map(
                    ([colIndex, segmentsInCol]) => (
                      <AccordionItem
                        key={`col-${colIndex}`}
                        value={`col-${colIndex}`}
                        className="rounded-md border px-4"
                      >
                        <AccordionTrigger>
                          Kolom ke-{parseInt(colIndex) + 1} (
                          {segmentsInCol.length})
                        </AccordionTrigger>
                        <AccordionContent className="pt-2">
                          {/* Level 3 Accordion: List of segments in that column */}
                          <Accordion type="multiple" className="space-y-2">
                            {segmentsInCol.map((segment, idx) => (
                              <SegmentDetailItem
                                key={`v-seg-${idx}`}
                                segment={segment}
                                idx={idx}
                                gridDimension={gridDimension}
                              />
                            ))}
                          </Accordion>
                        </AccordionContent>
                      </AccordionItem>
                    ),
                  )}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* --- HORIZONTAL SEGMENTS --- */}
          {hasHorizontalResults && (
            <AccordionItem value="segmen-horizontal">
              <AccordionTrigger className="text-lg font-semibold">
                ⇔ Segmen Horizontal
              </AccordionTrigger>
              <AccordionContent>
                {/* Level 2 Accordion: Group by Row */}
                <Accordion type="multiple" className="space-y-3">
                  {Object.entries(results.horizontal).map(
                    ([rowIndex, segmentsInRow]) => (
                      <AccordionItem
                        key={`row-${rowIndex}`}
                        value={`row-${rowIndex}`}
                        className="rounded-md border px-4"
                      >
                        <AccordionTrigger>
                          Baris ke-{parseInt(rowIndex) + 1} (
                          {segmentsInRow.length})
                        </AccordionTrigger>
                        <AccordionContent className="pt-2">
                          {/* Level 3 Accordion: List of segments in that row */}
                          <Accordion type="multiple" className="space-y-2">
                            {segmentsInRow.map((segment, idx) => (
                              <SegmentDetailItem
                                key={`h-seg-${idx}`}
                                segment={segment}
                                idx={idx}
                                gridDimension={gridDimension}
                                colorOffset={2}
                              />
                            ))}
                          </Accordion>
                        </AccordionContent>
                      </AccordionItem>
                    ),
                  )}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>
    </Card>
  );
}
