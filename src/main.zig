const std = @import("std");

const Point = struct {
    cx: f32,
    cy: f32,

    fn distance(self: *const Point, other: *const Point) f32 {
        const dx = self.cx - other.cx;
        const dy = self.cy - other.cy;
        return @sqrt(dx * dx + dy * dy);
    }
};

extern "env" fn print(ptr: [*]const u8, len: usize) void;
extern "env" fn getCurrentTime() f64;

export fn initialisePoints(num_points: usize, init_value: usize) [*]const Point {
    var rndGen = std.rand.DefaultPrng.init(init_value);
    const allocator = std.heap.page_allocator;
    const rand = rndGen.random();

    const points = allocator.alloc(Point, num_points) catch unreachable;

    for (points) |*point| {
        point.cx = rand.float(f32);
        point.cy = rand.float(f32);
    }

    return points.ptr;
}

export fn getPointOrder(points: [*]const Point, num_points: usize) [*]const usize {
    const allocator = std.heap.page_allocator;
    const order = allocator.alloc(usize, num_points) catch unreachable;
    const visited = allocator.alloc(bool, num_points) catch unreachable;

    for (visited) |*v| {
        v.* = false;
    }

    var current_point_idx: usize = 0;
    visited[current_point_idx] = true;
    order[0] = current_point_idx;

    for (1..num_points) |i| {
        var nearest_point_idx: usize = 0;
        var nearest_dist: f32 = std.math.floatMax(f32);

        for (0..num_points) |j| {
            if (!visited[j]) {
                const dist = points[current_point_idx].distance(&points[j]);
                if (dist < nearest_dist) {
                    nearest_dist = dist;
                    nearest_point_idx = j;
                }
            }
        }

        visited[nearest_point_idx] = true;
        order[i] = nearest_point_idx;
        current_point_idx = nearest_point_idx;
    }

    return order.ptr;
}

export fn benchmarkGetPointOrder(points: [*]const Point, num_points: usize) [*]const usize {
    const start_time = getCurrentTime();

    const allocator = std.heap.page_allocator;
    var order = getPointOrder(points, num_points);

    for (0..9) |_| {
        order = getPointOrder(points, num_points);
    }

    const end_time = getCurrentTime();
    const ms = end_time - start_time;
    const result = std.fmt.allocPrint(allocator, "Function took {d:.3} ms", .{ms}) catch unreachable;
    defer allocator.free(result);

    print(result.ptr, result.len);

    return order;
}
