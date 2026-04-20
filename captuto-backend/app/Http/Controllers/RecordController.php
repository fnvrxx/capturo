<?php

namespace App\Http\Controllers;

use App\Exports\RecordsExport;
use App\Http\Requests\Record\StoreRecordRequest;
use App\Http\Resources\RecordResource;
use App\Models\Record;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class RecordController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $request->validate(['template_id' => 'required|integer']);

        $template = $request->user()->templates()->findOrFail($request->template_id);

        $records = Record::where('template_id', $template->id)
            ->orderByDesc('created_at')
            ->get();

        return $this->success(RecordResource::collection($records));
    }

    public function store(StoreRecordRequest $request): JsonResponse
    {
        $request->user()->templates()->findOrFail($request->template_id);

        $record = Record::create([
            'template_id'       => $request->template_id,
            'user_id'           => $request->user()->id,
            'scanned_at'        => $request->scanned_at,
            'raw_json'          => $request->raw_json,
            'data'              => $request->data,
            'confidence_scores' => $request->confidence_scores,
            'document_image'    => $request->document_image,
        ]);

        return $this->success(new RecordResource($record), 'Record saved successfully', 201);
    }

    public function export(Request $request, int $templateId)
    {
        $template = $request->user()->templates()
            ->with('fields')
            ->findOrFail($templateId);

        $records = Record::where('template_id', $template->id)->get();

        $date = now()->format('Y-m-d');
        $filename = str_replace(' ', '_', $template->name) . "_{$date}.xlsx";

        return Excel::download(new RecordsExport($template, $records), $filename);
    }
}
