<?php

namespace App\Http\Controllers;

use App\Http\Requests\Template\StoreTemplateRequest;
use App\Http\Resources\TemplateResource;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TemplateController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $templates = $request->user()->templates()
            ->with('fields')
            ->withCount('records')
            ->get();

        return $this->success(TemplateResource::collection($templates));
    }

    public function store(StoreTemplateRequest $request): JsonResponse
    {
        $template = $request->user()->templates()->create([
            'name'        => $request->name,
            'description' => $request->description,
        ]);

        foreach ($request->fields as $index => $fieldData) {
            $template->fields()->create([
                'name'  => $fieldData['name'],
                'type'  => $fieldData['type'],
                'order' => $index,
            ]);
        }

        $template->load('fields');
        $template->loadCount('records');

        return $this->success(new TemplateResource($template), 'Template created successfully', 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $template = $request->user()->templates()
            ->with('fields')
            ->withCount('records')
            ->findOrFail($id);

        return $this->success(new TemplateResource($template));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $template = $request->user()->templates()->findOrFail($id);
        $template->delete();

        return $this->success(null, 'Template deleted successfully');
    }
}
