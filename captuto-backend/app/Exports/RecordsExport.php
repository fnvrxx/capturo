<?php

namespace App\Exports;

use App\Models\Template;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class RecordsExport implements FromCollection, WithHeadings, WithStyles
{
    public function __construct(
        protected Template $template,
        protected $records
    ) {}

    public function headings(): array
    {
        return $this->template->fields->pluck('name')->toArray();
    }

    public function collection()
    {
        $fieldNames = $this->template->fields->pluck('name')->toArray();

        return $this->records->map(function ($record) use ($fieldNames) {
            $row = [];
            foreach ($fieldNames as $fieldName) {
                $row[] = $record->data[$fieldName] ?? '';
            }
            return $row;
        });
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
